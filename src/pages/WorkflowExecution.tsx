import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Play, CheckCircle, Circle, Loader2, XCircle, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowStep, Workflow, SchemaField } from "@/types";

const statusIcon: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-5 w-5 text-success" />,
  running: <Loader2 className="h-5 w-5 text-info animate-spin" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
  failed: <XCircle className="h-5 w-5 text-destructive" />,
};

interface VisualStep extends WorkflowStep {
  status: any; // Allow transition statuses
  duration?: string;
}

interface ExecutionLog {
  id: string;
  step_name?: string;
  stepName?: string;
  step_type?: string;
  status: any;
  evaluated_rules?: any[];
  rulesEvaluated?: any[];
  selected_next_step?: string;
  selectedNextStep?: string;
  approver_id?: string | null;
  started_at?: string;
  ended_at?: string;
  timestamp: string;
  error_message?: string | null;
}

export default function WorkflowExecution() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [executionSteps, setExecutionSteps] = useState<VisualStep[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadWorkflow();
    }
  }, [id]);

  async function loadWorkflow() {
    try {
      setLoading(true);
      const { data: wfRaw, error: wfError } = await supabase
        .from('workflows')
        .select('id, name, version, input_schema, start_step_id')
        .eq('id', id || '')
        .single();

      if (wfError) throw wfError;
      const wf = wfRaw as Workflow;
      setWorkflow(wf);

      const { data: stps, error: stpError } = await supabase
        .from('workflow_steps')
        .select('id, name, step_type, step_order, metadata')
        .eq('workflow_id', id || '')
        .order('step_order', { ascending: true });

      if (stpError) throw stpError;
      setSteps(stps || []);

      // Initialize inputs based on schema
      const initInputs: Record<string, any> = {};
      if (wf.input_schema) {
        (wf.input_schema as SchemaField[]).forEach(field => {
          if (field.type === 'number') initInputs[field.name] = 0;
          else if (field.type === 'boolean') initInputs[field.name] = false;
          else if (field.type === 'select' && field.allowedValues?.length) initInputs[field.name] = field.allowedValues[0];
          else initInputs[field.name] = '';
        });
      }
      setInputs(initInputs);

    } catch (error: any) {
      toast({ title: "Error loading workflow", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function startExecution() {
    if (!workflow) return;

    // Validate required fields
    if (workflow.input_schema) {
      const missing = (workflow.input_schema as SchemaField[])
        .filter(f => f.required && !inputs[f.name]);
      if (missing.length > 0) {
        toast({ title: "Missing Required Fields", description: `Please fill in: ${missing.map(m => m.name).join(', ')}`, variant: "destructive" });
        return;
      }
    }

    try {
      setStarted(true);
      // 1. Create Execution Record
      const { data: execRaw, error: execError } = await (supabase as any)
        .from('workflow_executions')
        .insert({
          workflow_id: workflow.id,
          workflow_version: workflow.version,
          status: 'running',
          data: inputs,
          current_step_id: workflow.start_step_id,
          triggered_by: user?.id,
          logs: [],
        })
        .select('id')
        .single();

      if (execError) throw execError;
      const exec = execRaw as any;
      setExecutionId(exec.id);

      // Determine first step ID (with fallback to first step in list)
      const firstStepId = workflow.start_step_id || (steps.length > 0 ? steps[0].id : null);
      if (!firstStepId) throw new Error("No steps found in this workflow");

      // Map steps to visual progress layout
      const visualSteps: VisualStep[] = steps.map(s => ({
        ...s,
        status: (s.id === firstStepId ? 'running' : 'pending') as any
      }));
      setExecutionSteps(visualSteps);

      // 4. Update the execution record with the correct start step and status
      await supabase.from('workflow_executions')
        .update({ current_step_id: firstStepId, status: 'running' } as any)
        .eq('id', exec.id);

      // 5. Start simulation
      simulateExecution(exec.id, firstStepId, visualSteps);

    } catch (error: any) {
      toast({ title: "Failed to start execution", description: error.message, variant: "destructive" });
      setStarted(false);
    }
  }

  async function simulateExecution(execId: string, startStepId: string | null, visualSteps: any[]) {
    let currentStepId = startStepId;
    let currentVisual = [...visualSteps];
    const logsOut: any[] = [...executionLogs];
    let iterations = 0;
    const MAX_ITERATIONS = 50;

    while (currentStepId) {
      if (iterations >= MAX_ITERATIONS) {
        toast({ title: "Max iterations reached", description: "Preventing infinite loop", variant: "destructive" });
        break;
      }
      iterations++;

      const step = steps.find(s => s.id === currentStepId);
      if (!step) break;

      // Update visual to running
      currentVisual = currentVisual.map(s => s.id === currentStepId ? { ...s, status: 'running' } : s);
      setExecutionSteps([...currentVisual]);

      const stepStartedAt = new Date().toISOString();

      // Record the START of the current step in logs immediately
      if (step.step_type === 'approval') {
        const approvalLog = {
          id: crypto.randomUUID(),
          step_name: step.name,
          step_type: step.step_type,
          status: 'running',
          approver_id: user?.id,
          started_at: stepStartedAt,
          timestamp: stepStartedAt
        };
        const updatedLogs = [...executionLogs, approvalLog];
        setExecutionLogs(updatedLogs);

        await supabase.from('workflow_executions')
          .update({ current_step_id: currentStepId, status: 'running', logs: updatedLogs } as any)
          .eq('id', execId);

        return; // Simulation pauses for human action
      }

      // If Notification step, send email immediately
      if (step.step_type === 'notification') {
        const recipientEmail = step.metadata?.assignee_email || step.metadata?.to;
        const notifSubject = step.metadata?.subject || `[Flow Weaver] ${step.name}`;
        const notifBody = step.metadata?.template || step.metadata?.body ||
          `You have a new workflow notification.\n\nStep: ${step.name}\nWorkflow: ${workflow?.name}\n\nInput Data:\n${JSON.stringify(inputs, null, 2)}`;

        if (recipientEmail) {
          try {
            const emailRes = await fetch('http://localhost:3001/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: recipientEmail,
                subject: notifSubject,
                body: notifBody,
                workflowName: workflow?.name,
                stepName: step.name,
              }),
            });
            const emailResult = await emailRes.json();
            if (!emailResult.success) throw new Error(emailResult.error || 'Email failed');
            toast({ title: `📧 Email Sent`, description: `Notification sent to ${recipientEmail}` });
          } catch (emailErr: any) {
            // Non-fatal — log the error but continue execution
            toast({
              title: '⚠️ Email Not Sent',
              description: `Could not send to ${recipientEmail}: Is server.js running on port 3001?`,
              variant: 'destructive'
            });
          }
        }
      }

      // Call Rule engine RPC to figure out next step
      let nextStepId: string | null = null;
      let evaluatedRules: any[] = [];
      let logStatus = "passed";

      try {
        const { data: result, error: rpcError } = await (supabase as any).rpc('evaluate_step_rules', {
          p_step_id: currentStepId,
          p_input_data: inputs
        });

        if (rpcError) throw rpcError;

        const evalResult = result as any;
        nextStepId = evalResult.next_step_id;
        evaluatedRules = evalResult.evaluations.map((e: any) => ({
          rule: e.condition,
          result: e.result
        }));
      } catch (err: any) {
        logStatus = "failed";
        nextStepId = null; // stop execution
        evaluatedRules = [{ rule: "Error evaluating rules", result: false }];
      }


      // Execute Webhook if applicable
      if (step.step_type === 'webhook' && step.metadata?.url) {
        try {
          const res = await fetch(step.metadata.url, {
            method: step.metadata.method || 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(inputs)
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          logsOut.push({
            id: crypto.randomUUID(),
            stepName: step.name,
            rulesEvaluated: [`Webhook fired successfully to ${step.metadata.url}`],
            selectedNextStep: nextStepId ? steps.find(s => s.id === nextStepId)?.name : "-- END --",
            status: 'passed',
            timestamp: new Date().toISOString()
          });
        } catch (err: any) {
          logStatus = "failed";
          nextStepId = null; // stop execution
          logsOut.push({
            id: crypto.randomUUID(),
            stepName: step.name,
            rulesEvaluated: [`Webhook Failed: ${err.message}`],
            selectedNextStep: "-- FAILED --",
            status: 'failed',
            timestamp: new Date().toISOString()
          });
        }
      }

      const stepEndedAt = new Date().toISOString();

      // Record log following Halleyx Schema
      logsOut.push({
        id: crypto.randomUUID(),
        step_name: step.name,
        step_type: step.step_type,
        evaluated_rules: evaluatedRules,
        selected_next_step: nextStepId ? steps.find(s => s.id === nextStepId)?.name : "-- END --",
        status: logStatus === 'passed' ? 'completed' : 'failed',
        approver_id: user?.id,
        error_message: logStatus === 'failed' ? "Step failed during execution" : null,
        started_at: stepStartedAt,
        ended_at: stepEndedAt,
        timestamp: stepEndedAt // for legacy UI compatibility
      });

      setExecutionLogs([...logsOut]);

      // Mark visual step as completed/failed
      currentVisual = currentVisual.map(s => s.id === currentStepId ? { ...s, status: logStatus === 'passed' ? 'completed' : 'failed' } : s);
      setExecutionSteps([...currentVisual]);

      currentStepId = nextStepId;
    }

    await (supabase as any).from('workflow_executions')
      .update({
        status: currentStepId ? 'failed' : 'completed',
        logs: logsOut,
        ended_at: new Date().toISOString()
      })
      .eq('id', execId);
  }

  async function handleApprove() {
    if (!executionId) return;
    const currentStep = executionSteps.find(s => s.status === 'running');
    if (!currentStep) return;

    // Evaluate rules to find next step
    const { data: result } = await (supabase as any).rpc('evaluate_step_rules', {
      p_step_id: currentStep.id,
      p_input_data: { ...inputs, approval: 'approved' }
    });

    const evalResult = result as any;
    const nextStepId = evalResult.next_step_id;

    const filteredLogs = executionLogs.filter(l => !((l.step_name === currentStep?.name || l.stepName === currentStep?.name) && l.status === 'running'));
    const newLogs: ExecutionLog[] = [...filteredLogs, {
      id: crypto.randomUUID(),
      step_name: currentStep.name,
      step_type: 'approval',
      evaluated_rules: evalResult.evaluations.map((e: any) => ({ rule: e.condition, result: e.result })),
      selected_next_step: nextStepId ? steps.find(s => s.id === nextStepId)?.name : "-- END --",
      status: 'completed',
      approver_id: user?.id,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }];

    setExecutionLogs(newLogs);
    setExecutionSteps(prev => prev.map(s => currentStep && s.id === currentStep.id ? { ...s, status: 'completed' } : s));

    simulateExecution(executionId, nextStepId, executionSteps.map(s =>
      currentStep && s.id === currentStep.id ? { ...s, status: 'completed' } : s
    ));
  }

  async function handleReject() {
    if (!executionId) return;
    const currentStep = executionSteps.find(s => s.status === 'running');
    if (!currentStep) return;
    const filteredLogs = executionLogs.filter(l => !((l.step_name === currentStep?.name || l.stepName === currentStep?.name) && l.status === 'running'));
    const newLogs: ExecutionLog[] = [...filteredLogs, {
      id: crypto.randomUUID(),
      step_name: currentStep.name,
      step_type: 'approval',
      evaluated_rules: [{ rule: "Manual Rejection", result: true }],
      selected_next_step: "-- FAILED --",
      status: 'failed',
      approver_id: user?.id,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
      timestamp: new Date().toISOString()
    }];

    setExecutionLogs(newLogs);
    setExecutionSteps(prev => prev.map(s => currentStep && s.id === currentStep.id ? { ...s, status: 'failed' } : s));

    await (supabase as any).from('workflow_executions')
      .update({ status: 'failed', logs: newLogs, ended_at: new Date().toISOString() })
      .eq('id', executionId);
  }

  async function handleCancel() {
    if (!executionId) return;
    try {
      await supabase.from('workflow_executions')
        .update({ status: 'canceled', ended_at: new Date().toISOString() } as any)
        .eq('id', executionId);

      setExecutionSteps(prev => prev.map(s => s.status === 'running' ? { ...s, status: 'canceled' } : s));
      toast({ title: "Execution Canceled" });
      navigate('/executions');
    } catch (err: any) {
      toast({ title: "Cancel failed", description: err.message, variant: "destructive" });
    }
  }

  async function handleRetry() {
    if (!executionId || !workflow) return;
    try {
      // Find the last failed step
      const failedStep = executionSteps.find(s => s.status === 'failed');
      if (!failedStep) return;

      toast({ title: "Retrying step...", description: `Restarting ${failedStep.name}` });

      // Update status to running again
      await supabase.from('workflow_executions')
        .update({ status: 'running', retries: (workflow as any).retries + 1 || 1 } as any)
        .eq('id', executionId);

      // Re-run from this step
      simulateExecution(executionId, failedStep.id, executionSteps.map(s =>
        s.id === failedStep.id ? { ...s, status: 'running' } : s
      ));
    } catch (err: any) {
      toast({ title: "Retry failed", description: err.message, variant: "destructive" });
    }
  }

  if (loading) return <div className="p-12 text-center">Loading execution UI...</div>;

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-foreground">Execute Workflow</h1>
            <p className="mt-1 text-sm text-muted-foreground">{workflow?.name} — v{workflow?.version}</p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4">
          <h2 className="text-base font-semibold text-card-foreground">Input Parameters</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(workflow?.input_schema as SchemaField[])?.map(field => (
              <div key={field.name} className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {field.name} {field.required && <span className="text-destructive">*</span>}
                </label>
                {field.type === 'boolean' ? (
                  <select
                    value={inputs[field.name]}
                    onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value === 'true' })}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                ) : field.type === 'select' ? (
                  <select
                    value={inputs[field.name]}
                    onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.value })}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                  >
                    {field.allowedValues?.map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    onChange={(e) => setInputs({ ...inputs, [field.name]: e.target.files?.[0]?.name || '' })}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={inputs[field.name]}
                    onChange={(e) => setInputs({ ...inputs, [field.name]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                    placeholder={`Enter ${field.name}`}
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                )}
                {(field as any).description && <p className="text-xs text-muted-foreground">{(field as any).description}</p>}
              </div>
            ))}
            {(!workflow?.input_schema || (workflow.input_schema as any[]).length === 0) && (
              <div className="col-span-2 text-sm text-muted-foreground italic">No input parameters required for this workflow.</div>
            )}
          </div>
          <Button onClick={startExecution} className="gap-2 w-full sm:w-auto mt-4">
            <Play className="h-4 w-4" /> Start Execution
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Execution Progress</h1>
        <div className="flex items-center justify-between">
          <p className="mt-1 text-sm text-muted-foreground">{executionId} — {workflow?.name}</p>
          <div className="flex gap-2">
            {executionSteps.find(s => s.status === 'running')?.step_type === 'approval' && (
              <>
                <Button onClick={handleApprove} className="bg-success hover:bg-success/90">Approve</Button>
                <Button onClick={handleReject} variant="destructive">Reject</Button>
              </>
            )}
            {executionSteps.some(s => s.status === 'running') && (
              <Button variant="outline" size="sm" onClick={handleCancel} className="text-destructive border-destructive/20 hover:bg-destructive/5">
                Cancel
              </Button>
            )}
            {executionSteps.some(s => s.status === 'failed') && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="gap-1">
                <Play className="h-3 w-3" /> Retry Failed Step
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-1">
        {executionSteps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              {statusIcon[step.status || "pending"]}
              {i < executionSteps.length - 1 && <div className="mt-1 h-10 w-px bg-border" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-foreground">{step.name}</p>
                <StatusBadge variant={step.status || "pending"}>
                  {step.status === 'running' && step.step_type === 'approval' ? 'Waiting for Approval' : step.status}
                </StatusBadge>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{step.step_type}</span>
                {step.duration && <span>• {step.duration}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="rounded-lg border border-border bg-card card-shadow">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-card-foreground">Execution Logs</h2>
        </div>
        <div className="divide-y divide-border">
          {executionLogs.map((log) => (
            <div key={log.id}>
              <button
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-muted/50 transition-colors"
              >
                {expandedLog === log.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">{log.step_name || log.stepName}</span>
                  <StatusBadge variant={log.status as any}>{log.status}</StatusBadge>
                </div>
                <span className="text-xs text-muted-foreground">{log.timestamp}</span>
              </button>
              {expandedLog === log.id && (
                <div className="border-t border-border bg-muted/30 px-6 py-4 pl-14">
                  <div className="space-y-3">
                    {/* Step Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-muted-foreground font-medium">Step Type:</span> <span className="capitalize font-mono bg-background px-1.5 py-0.5 rounded">{log.step_type || '—'}</span></div>
                      <div><span className="text-muted-foreground font-medium">Approver:</span> <span className="font-mono bg-background px-1.5 py-0.5 rounded">{log.approver_id ? log.approver_id.slice(0, 8) + '...' : '—'}</span></div>
                      {log.started_at && <div><span className="text-muted-foreground font-medium">Started:</span> {new Date(log.started_at).toLocaleTimeString()}</div>}
                      {log.ended_at && <div><span className="text-muted-foreground font-medium">Ended:</span> {new Date(log.ended_at).toLocaleTimeString()}</div>}
                    </div>
                    {/* Email sent badge for notification steps */}
                    {log.step_type === 'notification' && (
                      <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded">
                        📧 <span><strong>Email notification</strong> triggered for this step</span>
                      </div>
                    )}
                    {/* Rules */}
                    {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Rules Evaluated</p>
                        <div className="space-y-1">
                          {log.evaluated_rules.map((e: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <code className="flex-1 rounded bg-background px-2 py-1 text-foreground">{e.rule}</code>
                              <span>{e.result ? '✅' : '❌'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Next Step */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Selected Next Step</p>
                      <p className="text-sm text-foreground font-medium">{log.selected_next_step || log.selectedNextStep || '— END —'}</p>
                    </div>
                    {/* Error */}
                    {log.error_message && (
                      <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
                        ⚠️ {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
