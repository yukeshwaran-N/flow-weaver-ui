import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Play, CheckCircle, Circle, Loader2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import type { WorkflowStep, ExecutionLog } from "@/types";

const executionSteps: WorkflowStep[] = [
  { id: "1", name: "Validate Input", type: "task", order: 1, status: "completed", duration: "0.3s" },
  { id: "2", name: "Manager Approval", type: "approval", order: 2, status: "completed", duration: "12m" },
  { id: "3", name: "Process Payment", type: "task", order: 3, status: "running", duration: "2.1s" },
  { id: "4", name: "Send Confirmation", type: "notification", order: 4, status: "pending" },
];

const executionLogs: ExecutionLog[] = [
  { id: "1", stepName: "Validate Input", rulesEvaluated: ['amount > 0', 'country != ""'], selectedNextStep: "Manager Approval", status: "passed", timestamp: "2026-03-13 09:15:01" },
  { id: "2", stepName: "Manager Approval", rulesEvaluated: ['amount > 1000 && priority == "High"', 'amount > 100'], selectedNextStep: "Process Payment", status: "passed", timestamp: "2026-03-13 09:27:15" },
  { id: "3", stepName: "Process Payment", rulesEvaluated: ['payment_valid == true'], selectedNextStep: "Send Confirmation", status: "passed", timestamp: "2026-03-13 09:27:18" },
];

const statusIcon = {
  completed: <CheckCircle className="h-5 w-5 text-success" />,
  running: <Loader2 className="h-5 w-5 text-info animate-spin" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
  failed: <XCircle className="h-5 w-5 text-destructive" />,
};

export default function WorkflowExecution() {
  const [started, setStarted] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [inputs, setInputs] = useState({ amount: "", country: "", department: "", priority: "Medium" });

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Execute Workflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">Order Processing — v3</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4">
          <h2 className="text-base font-semibold text-card-foreground">Input Parameters</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Amount <span className="text-destructive">*</span></label>
              <input type="number" value={inputs.amount} onChange={(e) => setInputs({ ...inputs, amount: e.target.value })} placeholder="Enter amount" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Country <span className="text-destructive">*</span></label>
              <input type="text" value={inputs.country} onChange={(e) => setInputs({ ...inputs, country: e.target.value })} placeholder="Enter country" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Department</label>
              <input type="text" value={inputs.department} onChange={(e) => setInputs({ ...inputs, department: e.target.value })} placeholder="Enter department" className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Priority <span className="text-destructive">*</span></label>
              <select value={inputs.priority} onChange={(e) => setInputs({ ...inputs, priority: e.target.value })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <Button onClick={() => setStarted(true)} className="gap-2 w-full sm:w-auto">
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
        <p className="mt-1 text-sm text-muted-foreground">EXE-007 — Order Processing</p>
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
                <StatusBadge variant={step.status || "pending"}>{step.status}</StatusBadge>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{step.type}</span>
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
                  <span className="text-sm font-medium text-foreground">{log.stepName}</span>
                  <StatusBadge variant={log.status}>{log.status}</StatusBadge>
                </div>
                <span className="text-xs text-muted-foreground">{log.timestamp}</span>
              </button>
              {expandedLog === log.id && (
                <div className="border-t border-border bg-muted/30 px-6 py-4 pl-14">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Rules Evaluated</p>
                      <div className="mt-1 space-y-1">
                        {log.rulesEvaluated.map((rule, i) => (
                          <code key={i} className="block rounded bg-background px-2 py-1 text-xs text-foreground">{rule}</code>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Selected Next Step</p>
                      <p className="text-sm text-foreground">{log.selectedNextStep}</p>
                    </div>
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
