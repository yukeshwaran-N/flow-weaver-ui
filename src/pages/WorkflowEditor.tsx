// src/pages/WorkflowEditor.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Zap, FileCode,
  Copy, Play, Terminal, Globe, Mail, Bell, Save, Sparkles, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useNodesState, useEdgesState, addEdge, Node, Edge } from '@xyflow/react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCompany } from "@/hooks/useCompany";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import type { SchemaField, Workflow } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function WorkflowEditor() {
  const { id } = useParams(); // For editing existing workflow
  const navigate = useNavigate();
  const location = useLocation();
  const { company } = useCompany();
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscriptionTier, loading: roleLoading } = useUserRole();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: "",
    description: "",
    is_active: false,
    input_schema: [],
  });
  const [steps, setSteps] = useState<any[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [activeTab, setActiveTab] = useState<'editor' | 'executions' | 'logs'>('editor');
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [logs, setLogs] = useState<{ time: string, level: string, message: string }[]>([
    { time: new Date().toLocaleTimeString(), level: 'SYSTEM', message: 'Workspace initialized. Ready for execution.' }
  ]);
  const [nodeResults, setNodeResults] = useState<Record<string, any>>({});

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Auto-open AI modal if requested via URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('ai') === 'true' && !id) {
      setIsAiModalOpen(true);
      // Clean up the URL after opening
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, id, location.pathname]);

  // Load workflow if editing
  useEffect(() => {
    if (id && user) {
      loadWorkflow();
    }
  }, [id, user]);

  async function loadWorkflow() {
    setLoading(true);
    try {
      const { data: loadedWorkflow, error: workflowError } = await supabase
        .from('workflows')
        .select('id, name, description, version, is_active, input_schema, start_step_id')
        .eq('id', id || '')
        .single();

      if (workflowError) throw workflowError;
      if (loadedWorkflow) {
        setWorkflow(loadedWorkflow as any);
      }

      const { data: stepsData, error: stepsError } = await supabase
        .from('workflow_steps')
        .select('id, workflow_id, name, step_type, step_order, metadata')
        .eq('workflow_id', id || '')
        .order('step_order', { ascending: true });

      if (stepsError) throw stepsError;
      if (stepsData) {
        const typedSteps = stepsData as any[];
        setSteps(typedSteps);
        const initialNodes: Node[] = typedSteps.map((s, i) => ({
          id: s.id,
          type: 'workflowNode',
          position: s.metadata?.position || { x: 100, y: 100 + (i * 150) },
          data: { label: s.name, type: s.step_type, params: s.metadata?.params || {} },
        }));
        setNodes(initialNodes);

        const { data: rulesData } = await supabase
          .from('step_rules')
          .select('id, step_id, next_step_id, condition')
          .in('step_id', typedSteps.map(s => s.id));

        if (rulesData) {
          const initialEdges: Edge[] = (rulesData as any[])
            .filter(r => r.next_step_id)
            .map(r => ({
              id: r.id,
              source: r.step_id,
              target: r.next_step_id,
              label: r.condition || 'true',
              animated: true,
            } as Edge));
          setEdges(initialEdges);
        }
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to load workflow",
        variant: "destructive",
      });
      navigate('/workflows');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let currentWorkflowId = id;
      if (id) {
        const { error: wError } = await (supabase as any)
          .from('workflows')
          .update({
            name: workflow.name,
            version: workflow.version,
            is_active: workflow.is_active,
            input_schema: workflow.input_schema,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);
        if (wError) throw wError;
      } else {
        const { count } = await supabase
          .from('workflows')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (subscriptionTier === 'free' && (count || 0) >= 3) {
          toast({ title: "Limit Reached", description: "Free plan is limited to 3 workflows.", variant: "destructive" });
          setSaving(false);
          navigate('/admin/pricing');
          return;
        }

        const { data: wData, error: wError } = await (supabase as any)
          .from('workflows')
          .insert([{
            name: workflow.name || "New Workflow",
            company_id: company?.id,
            user_id: user.id,
            version: 1,
            is_active: workflow.is_active ?? true,
            input_schema: workflow.input_schema || [],
          }])
          .select('id')
          .single();
        if (wError) throw wError;
        currentWorkflowId = wData.id;
      }

      if (currentWorkflowId) {
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        // Map and validate step IDs
        const nodeIdMap: Record<string, string> = {};
        const stepsToSave = nodes.map((node, index) => {
          const newId = isUUID(node.id) ? node.id : crypto.randomUUID();
          nodeIdMap[node.id] = newId;

          const originalStep = (steps as any[]).find(s => s.id === node.id);
          return {
            id: newId,
            workflow_id: currentWorkflowId,
            company_id: company?.id,
            user_id: user.id,
            name: (node.data as any).label as string,
            step_type: (node.data as any).type as any,
            step_order: index + 1,
            metadata: {
              ...(originalStep?.metadata || {}),
              position: node.position,
              params: (node.data as any).params || {}
            }
          };
        });

        await supabase.from('workflow_steps').delete().eq('workflow_id', currentWorkflowId);
        const { error: stepsError } = await supabase.from('workflow_steps').insert(stepsToSave as any);
        if (stepsError) throw stepsError;

        await supabase.from('step_rules').delete().in('step_id', stepsToSave.map(s => s.id));
        if (edges.length > 0) {
          const rulesToInsert = edges.map((edge) => ({
            id: isUUID(edge.id) ? edge.id : crypto.randomUUID(),
            workflow_id: currentWorkflowId,
            step_id: nodeIdMap[edge.source] || edge.source,
            next_step_id: nodeIdMap[edge.target] || edge.target,
            condition: edge.label as string || 'true',
            priority: 1
          }));
          await supabase.from('step_rules').insert(rulesToInsert as any);
        }

        if (stepsToSave.length > 0) {
          await (supabase as any).from('workflows')
            .update({ start_step_id: stepsToSave[0].id })
            .eq('id', currentWorkflowId);
        }
      }

      toast({ title: "Success", description: id ? "Workflow updated" : "Workflow created" });
      navigate('/workflows');
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save workflow", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const handleTestExecute = async () => {
    if (executing) return;
    setExecuting(true);
    setIsBottomPanelOpen(true);
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'ENGINE', message: 'Starting manual test execution...' }]);

    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executing: true } })));
    toast({ title: "Starting Test Execution", description: "Triggering workflow engine..." });

    try {
      await handleSave();

      // Simulate node-by-node execution
      const results: Record<string, any> = {};
      for (const node of nodes) {
        const nodeType = (node.data as any).type;
        const nodeLabel = (node.data as any).label;

        setLogs(prev => [...prev, {
          time: new Date().toLocaleTimeString(),
          level: 'NODE',
          message: `Executing ${nodeLabel} (${nodeType.toUpperCase()})...`
        }]);

        if (nodeType === 'python') {
          const code = (node.data as any).params?.code || "";
          setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'PYTHON', message: 'Connecting to local execution bridge...' }]);

          try {
            const response = await fetch('http://localhost:8001/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            });

            if (!response.ok) throw new Error("Bridge response failed");

            const result = await response.json();
            results[node.id] = result;

            if (result.success) {
              setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'PYTHON', message: `Output: ${result.stdout || '(no output)'}` }]);
              if (result.stderr) {
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'WARNING', message: `Stderr: ${result.stderr}` }]);
              }
            } else {
              setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'ERROR', message: `Python Error: ${result.error || result.stderr}` }]);
            }
          } catch (e) {
            setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'ERROR', message: 'Could not connect to Python Bridge. Is executor.py running on port 8001?' }]);
            throw new Error("Python execution failed: Bridge unavailable");
          }
        } else if (nodeType === 'notification') {
          const params = (node.data as any).params || {};
          const recipient = params.assignee_email || params.to;
          setLogs(prev => [...prev, {
            time: new Date().toLocaleTimeString(), level: 'NODE',
            message: recipient ? `📧 Sending email to ${recipient}...` : '⚠️ No assignee_email set on this step'
          }]);
          if (recipient) {
            try {
              const emailRes = await fetch('http://localhost:3001/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: recipient,
                  subject: params.subject || `[Flow Weaver] ${nodeLabel}`,
                  body: params.body || `Automated notification from workflow step: ${nodeLabel}`,
                  workflowName: workflow.name,
                  stepName: nodeLabel,
                })
              });
              const emailResult = await emailRes.json();
              if (emailResult.success) {
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'SUCCESS', message: `✅ Email sent to ${recipient}` }]);
              } else {
                setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'WARNING', message: `Email failed: ${emailResult.error}` }]);
              }
            } catch {
              setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'WARNING', message: '⚠️ Cannot reach email server — is server.js running on port 3001?' }]);
            }
          }
          results[node.id] = { status: 'notified', email_sent: !!recipient };
        } else if (nodeType === 'approval') {
          setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'NODE', message: `✅ ${nodeLabel}: auto-approved (test mode)` }]);
          await new Promise(r => setTimeout(r, 400));
          results[node.id] = { status: 'approved', test_mode: true };
        } else {
          await new Promise(r => setTimeout(r, 400));
          results[node.id] = { status: 'success', processed: true };
        }
      }

      setNodeResults(results);

      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'SUCCESS', message: 'Workflow execution completed successfully.' }]);
      toast({ title: "Execution Successful", description: "All steps processed." });
    } catch (error: any) {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), level: 'ERROR', message: `Execution failed: ${error.message}` }]);
      toast({ title: "Test Failed", description: error.message || "An error occurred", variant: "destructive" });
    } finally {
      setExecuting(false);
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executing: false } })));
    }
  };

  function handleImportJson() {
    if (!jsonContent.trim()) return;
    try {
      const data = JSON.parse(jsonContent);
      setWorkflow({
        ...workflow,
        name: data.name || workflow.name,
        description: data.description || workflow.description,
        input_schema: data.input_schema || workflow.input_schema || [],
      });

      if (Array.isArray(data.nodes)) {
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const idMap: Record<string, string> = {};

        const newNodes: Node[] = data.nodes.map((n: any) => {
          const newId = (n.id && isUUID(n.id)) ? n.id : crypto.randomUUID();
          if (n.id) idMap[n.id] = newId;
          return {
            id: newId,
            type: 'workflowNode',
            position: n.position || { x: 100, y: 100 },
            data: {
              label: n.data?.label || n.name || 'New Step',
              type: n.data?.type || n.type || 'task',
              params: n.data?.params || n.params || {}
            }
          };
        });
        setNodes(newNodes);

        if (Array.isArray(data.edges)) {
          const newEdges: Edge[] = data.edges.map((e: any) => ({
            id: (e.id && isUUID(e.id)) ? e.id : crypto.randomUUID(),
            source: idMap[e.source] || e.source,
            target: idMap[e.target] || e.target,
            label: e.label || e.condition || 'true',
            animated: true
          }));
          setEdges(newEdges);
        }
      }
      setIsJsonModalOpen(false);
      setJsonContent("");
      toast({ title: "Success", description: "Workflow imported" });
    } catch (e) {
      toast({ title: "Import Failed", description: "Invalid JSON", variant: "destructive" });
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(jsonContent);
    toast({ title: "Copied", description: "JSON copied to clipboard" });
  }

  function addCodeNode() {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'workflowNode',
      position: { x: 400, y: 300 },
      data: {
        label: 'Execute JS',
        type: 'code',
        params: { code: 'return { json: { status: "ok" } };' }
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      // Prompt engineering to force the AI to return the specific JSON format
      const refinedPrompt = `
        You are a workflow designer for "Flow Weaver". 
        Generate a workflow in JSON format absolutely matching this structure:
        {
          "name": "Name of workflow",
          "description": "Short description",
          "input_schema": [{ "id": "f1", "name": "field_name", "type": "string|number|select", "required": true }],
          "nodes": [
            { "id": "n1", "position": { "x": 0, "y": 0 }, "data": { "label": "Step Name", "type": "trigger|approval|notification|webhook|python|smtp", "params": { ... } } }
          ],
          "edges": [
            { "id": "e1", "source": "n1", "target": "n2", "label": "condition or 'true'" }
          ]
        }

        User Request: ${aiPrompt}

        Return ONLY the raw JSON. No markdown, no backticks, no explanations.
      `;

      const response = await fetch('https://yukesh.pythonanywhere.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: refinedPrompt })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Server Error Stats:", response.status, errorText);
        throw new Error(`AI Server Error: ${response.status} - ${errorText}`);
      }

      const rawText = await response.text();
      // Clean up in case the AI added backticks despite instructions
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanJson);

      // Apply to editor
      setWorkflow({
        ...workflow,
        name: data.name || workflow.name,
        description: data.description || workflow.description,
        input_schema: data.input_schema || workflow.input_schema || [],
      });

      if (Array.isArray(data.nodes)) {
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        const idMap: Record<string, string> = {};

        const newNodes: Node[] = data.nodes.map((n: any) => {
          const newId = (n.id && isUUID(n.id)) ? n.id : crypto.randomUUID();
          if (n.id) idMap[n.id] = newId;
          return {
            id: newId,
            type: 'workflowNode',
            position: n.position || { x: 100 + (Math.random() * 200), y: 100 + (Math.random() * 200) },
            data: {
              ...(n.data || {}),
              label: n.data?.label || n.name || 'AI Step',
              type: n.data?.type || n.type || 'task',
              params: n.data?.params || n.params || {}
            }
          };
        });
        setNodes(newNodes);

        if (Array.isArray(data.edges)) {
          const newEdges: Edge[] = data.edges.map((e: any) => ({
            id: (e.id && isUUID(e.id)) ? e.id : crypto.randomUUID(),
            source: idMap[e.source] || e.source,
            target: idMap[e.target] || e.target,
            label: e.label || e.condition || 'true',
            animated: true
          }));
          setEdges(newEdges);
        }
      }

      setIsAiModalOpen(false);
      setAiPrompt("");
      toast({ title: "AI Generation Success", description: "Workflow generated and loaded." });

    } catch (err: any) {
      console.error("AI Generation Error:", err);
      toast({
        title: "AI Generation Failed",
        description: "Could not parse AI response. Ensure the Flask server is running on https://yukesh.pythonanywhere.com.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function addPythonNode() {
    const newNode: Node = {
      id: crypto.randomUUID(),
      type: 'workflowNode',
      position: { x: 450, y: 350 },
      data: {
        label: 'Python Script',
        type: 'python',
        params: { code: 'def main():\n    return {"status": "ok"}' }
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }

  function addSchemaField() {
    const newField: SchemaField = { id: crypto.randomUUID(), name: "", type: "string", required: false };
    setWorkflow({ ...workflow, input_schema: [...(workflow.input_schema || []), newField] });
  }

  if (loading || roleLoading) {
    return (
      <div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-slate-400 font-bold tracking-widest uppercase text-[10px]">Loading Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-white/5 bg-slate-900 flex items-center justify-between px-6 z-20 shadow-2xl shrink-0">
        <div className="flex items-center gap-6 flex-1 min-w-max">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-white/5 text-slate-400">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black italic tracking-tighter text-white leading-tight">{workflow.name || "Untitled"}</h1>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live Editor</p>
            </div>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex flex-[2] justify-center px-4">
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-2xl border border-white/10 shadow-inner">
            {(['editor', 'executions', 'logs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                  ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}
                `}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 lg:gap-4 flex-1 min-w-max">
          <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10">
            <Button onClick={() => setIsJsonModalOpen(true)} variant="ghost" size="sm" className="h-9 px-4 gap-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 font-black uppercase text-[10px] rounded-xl transition-all">
              <FileCode className="h-3.5 w-3.5" /> <span className="hidden xl:inline">JSON CODE</span>
            </Button>

            {subscriptionTier === 'pro' && (
              <Button
                onClick={() => setIsAiModalOpen(true)}
                variant="ghost"
                size="sm"
                className="h-9 px-4 gap-2 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 font-black uppercase text-[10px] rounded-xl transition-all shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 relative group"
              >
                <Sparkles className="h-3.5 w-3.5 fill-amber-500/20 transition-transform group-hover:rotate-12" />
                <span className="hidden xl:inline">AI Architect</span>
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} variant="ghost" size="sm" className="h-9 px-4 gap-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-black uppercase text-[10px] rounded-xl border border-blue-500/20">
              <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button onClick={handleTestExecute} disabled={executing} variant="ghost" size="sm" className="h-9 px-5 gap-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 font-black uppercase text-[10px] rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <Play className="h-4 w-4 fill-emerald-400/30" /> Run Test
            </Button>
          </div>

          <div className="w-[1px] h-8 bg-white/10" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="h-8 w-8 ring-2 ring-white/5 hover:ring-indigo-500/50 transition-all cursor-pointer">
                <AvatarFallback className="bg-indigo-600 text-white text-xs font-black">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 bg-slate-900 border-white/10 text-slate-200 rounded-xl shadow-2xl">
              <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 focus:bg-white/5 focus:text-white cursor-pointer py-2.5 font-bold text-xs uppercase">
                <Bell className="h-4 w-4" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsJsonModalOpen(true)} className="gap-2 focus:bg-white/5 focus:text-white cursor-pointer py-2.5 font-bold text-xs uppercase">
                <FileCode className="h-4 w-4" /> Workflow JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={handleSignOut} className="gap-2 focus:bg-red-500/10 text-red-500 focus:text-red-400 cursor-pointer py-2.5 font-black text-xs uppercase text-red-500">
                <Trash2 className="h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={(params) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds))}
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
          onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
        />

        {/* Floating Add Node Toolbar (Bottom Center) */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 p-2 bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
          <Button variant="ghost" size="sm" onClick={() => {
            const newNode: Node = {
              id: crypto.randomUUID(),
              type: 'workflowNode',
              position: { x: 100, y: 300 },
              data: { label: 'Chat Trigger', type: 'trigger', params: {} },
            };
            setNodes((nds) => [newNode, ...nds]);
          }} className="gap-2 text-rose-400 font-black hover:bg-rose-500/10 rounded-2xl h-10 px-4">
            <Zap className="h-4 w-4 fill-rose-400" /> Trigger
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="sm" onClick={addCodeNode} className="gap-2 text-orange-400 font-black hover:bg-orange-500/10 rounded-2xl h-10 px-4">
            <Terminal className="h-4 w-4" /> JS
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="sm" onClick={addPythonNode} className="gap-2 text-sky-400 font-black hover:bg-sky-500/10 rounded-2xl h-10 px-4">
            <Terminal className="h-4 w-4" /> Python
          </Button>
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          {(['task', 'notification', 'webhook', 'smtp'] as const).map(type => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => {
                const newNode: Node = {
                  id: crypto.randomUUID(),
                  type: 'workflowNode',
                  position: { x: 400 + (Math.random() * 50), y: 300 + (Math.random() * 50) },
                  data: { label: `New ${type}`, type, params: {} },
                };
                setNodes((nds) => nds.concat(newNode));
              }}
              className="gap-2 h-10 text-[10px] font-black uppercase rounded-2xl px-4 hover:bg-white/5"
            >
              <Plus className="h-3 w-3" /> {type}
              {(type === 'webhook' || type === 'smtp') && subscriptionTier === 'free' && <Zap className="h-3 w-3 text-amber-500" />}
            </Button>
          ))}
          <div className="w-[1px] h-6 bg-white/10 mx-1" />
          <Button variant="ghost" size="sm" onClick={addSchemaField} className="gap-2 text-blue-400 font-black hover:bg-blue-500/10 rounded-2xl h-10 px-4">
            <Plus className="h-4 w-4" /> Input
          </Button>
        </div>

        {/* Bottom Panel Toggle */}
        <div className="absolute bottom-6 right-6 z-10">
          <Button
            onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
            className={`
              h-10 px-6 gap-2 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all
              ${isBottomPanelOpen ? 'bg-indigo-600 text-white' : 'bg-slate-900/80 backdrop-blur-md border border-white/5 text-slate-400 hover:text-white'}
            `}
          >
            <Terminal className="w-4 h-4" />
            {isBottomPanelOpen ? 'Hide Logs' : 'Show Logs'}
          </Button>
        </div>

        {/* Collapsible Bottom Panel */}
        <div className={`
          absolute bottom-0 left-0 w-full bg-slate-900/98 backdrop-blur-3xl border-t border-white/10 transition-all duration-500 z-30
          ${isBottomPanelOpen ? 'h-[300px]' : 'h-0 overflow-hidden'}
        `}>
          <div className="absolute top-4 right-4 z-40">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsBottomPanelOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-500 hover:text-white"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </Button>
          </div>
          <div className="flex h-full">
            <div className="w-64 border-r border-white/5 p-6 flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Execution Sessions</h4>
              <div className="space-y-2">
                <div className="p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-[10px] font-black text-indigo-400 mb-1 leading-none uppercase tracking-tighter">Current Session</p>
                  <p className="text-[8px] text-indigo-300/60 font-mono">ID: {id?.slice(0, 8) || 'local'}-test</p>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto">
              <div className="flex flex-col gap-2">
                {logs.map((log, i) => (
                  <div key={i} className={`flex gap-4 ${log.level === 'ERROR' ? 'text-red-400' : ''} ${log.level === 'SUCCESS' ? 'text-emerald-400' : ''}`}>
                    <span className="text-slate-500 uppercase tracking-tighter font-black w-24 shrink-0">{log.time}</span>
                    <span className={`font-bold uppercase tracking-tighter w-16 shrink-0 ${log.level === 'PYTHON' ? 'text-sky-400' :
                      log.level === 'NODE' ? 'text-indigo-400' :
                        log.level === 'ENGINE' ? 'text-emerald-400' :
                          'text-slate-400'
                      }`}>{log.level}</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
                {executing && (
                  <div className="flex gap-4 animate-pulse">
                    <span className="text-slate-500 uppercase tracking-tighter font-black w-24 shrink-0">{new Date().toLocaleTimeString()}</span>
                    <span className="text-emerald-400 font-bold uppercase tracking-tighter w-16 shrink-0">Engine</span>
                    <span className="text-emerald-200">Processing next step...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Side Panel */}
      <Sheet open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <SheetContent className="sm:max-w-[1240px] md:max-w-[1400px] bg-slate-950 border-l border-white/5 p-0 flex flex-col">
          <SheetHeader className="p-4 px-6 border-b border-white/5 bg-slate-900/50 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-slate-800 border border-white/10">
                {(() => {
                  const type = nodes.find(n => n.id === selectedNodeId)?.data?.type;
                  if (type === 'webhook') return <Globe className="w-5 h-5 text-purple-400" />;
                  if (type === 'smtp') return <Mail className="w-5 h-5 text-indigo-400" />;
                  if (type === 'notification') return <Bell className="w-5 h-5 text-green-400" />;
                  if (type === 'code') return <Terminal className="w-5 h-5 text-orange-400" />;
                  return <Zap className="w-5 h-5 text-blue-400" />;
                })()}
              </div>
              <div>
                <Input
                  className="h-8 py-0 px-2 font-black italic bg-transparent border-none text-xl text-white focus-visible:ring-0 min-w-[200px]"
                  value={nodes.find(n => n.id === selectedNodeId)?.data?.label as string || ""}
                  onChange={(e) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, label: e.target.value } } : n))}
                />
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] px-2.5">Step Configuration</p>
              </div>
            </div>
            <Button onClick={() => setSelectedNodeId(null)} className="h-9 px-8 rounded-xl font-black">Done</Button>
          </SheetHeader>

          <div className="flex-1 flex overflow-hidden">
            {/* Input Data Pane */}
            <div className="w-[320px] border-r border-white/5 bg-slate-900/20 p-6 overflow-y-auto">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 font-bold flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-500 rounded-full" /> Input Variables
              </h4>
              <div className="space-y-3">
                {workflow.input_schema?.map((field: any) => (
                  <div key={field.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-white/5">
                    <span className="text-xs font-bold text-slate-300">{field.name}</span>
                    <Copy className="w-3 h-3 text-slate-600 cursor-pointer hover:text-white" onClick={() => { navigator.clipboard.writeText(`{{${field.name}}}`); toast({ title: "Copied", description: "Variable copied" }); }} />
                  </div>
                ))}
                {(!workflow.input_schema || workflow.input_schema.length === 0) && (
                  <p className="text-[10px] text-slate-600 italic">No input variables defined for this workflow.</p>
                )}
              </div>
            </div>

            {/* Parameters Pane */}
            <div className="flex-1 flex flex-col bg-slate-950 p-8 overflow-y-auto">
              <Tabs defaultValue="params" className="w-full max-w-2xl mx-auto">
                <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-12 mb-8 gap-8">
                  <TabsTrigger value="params" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-xs font-black uppercase">Parameters</TabsTrigger>
                  <TabsTrigger value="settings" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-xs font-black uppercase">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="params" className="mt-0">
                  {(() => {
                    const node = nodes.find(n => n.id === selectedNodeId);
                    const params = (node?.data as any)?.params || {};
                    const updateParams = (u: any) => setNodes(nds => nds.map(n => n.id === selectedNodeId ? { ...n, data: { ...n.data, params: { ...params, ...u } } } : n));

                    switch (node?.data?.type) {
                      case 'code':
                        return (
                          <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Node Logic (JavaScript)</Label>
                            <Textarea className="min-h-[400px] font-mono text-xs bg-slate-950 border-white/5 text-orange-400 rounded-2xl p-6 leading-relaxed" value={params.code || ''} onChange={e => updateParams({ code: e.target.value })} />
                          </div>
                        );
                      case 'python':
                        return (
                          <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Node Logic (Python)</Label>
                            <Textarea className="min-h-[400px] font-mono text-xs bg-slate-950 border-white/5 text-sky-400 rounded-2xl p-6 leading-relaxed" value={params.code || ''} onChange={e => updateParams({ code: e.target.value })} />
                          </div>
                        );
                      case 'smtp':
                        return (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Host</Label><Input className="bg-slate-900 border-white/10" value={params.host || ''} onChange={e => updateParams({ host: e.target.value })} /></div>
                              <div className="space-y-2"><Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Port</Label><Input className="bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500" value={params.port || ''} onChange={e => updateParams({ port: e.target.value })} /></div>
                            </div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">To</Label><Input className="bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500" value={params.to || ''} onChange={e => updateParams({ to: e.target.value })} /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Subject</Label><Input className="bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500" value={params.subject || ''} onChange={e => updateParams({ subject: e.target.value })} /></div>
                            <div className="space-y-2"><Label>Body</Label><Textarea className="min-h-[150px] bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500" value={params.body || ''} onChange={e => updateParams({ body: e.target.value })} /></div>
                          </div>
                        );
                      case 'webhook':
                        return (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Method</Label>
                              <Select value={params.method || 'GET'} onValueChange={v => updateParams({ method: v })}>
                                <SelectTrigger className="bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500">
                                  {['GET', 'POST', 'PUT', 'DELETE'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">URL</Label><Input className="bg-slate-900 border-white/10 text-slate-100 placeholder:text-slate-500" value={params.url || ''} onChange={e => updateParams({ url: e.target.value })} /></div>
                          </div>
                        );
                      default:
                        return <div className="text-center py-20 opacity-30"><p className="text-sm font-bold">Standard Task Node</p></div>;
                    }
                  })()}
                </TabsContent>
                <TabsContent value="settings"><p className="text-center py-20 text-slate-600 italic">Advanced settings coming soon.</p></TabsContent>
              </Tabs>
            </div>

            {/* Output Pane */}
            <div className="w-[320px] border-l border-white/5 bg-slate-900/20 p-6 flex flex-col">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                <div className="w-1 h-1 bg-slate-500 rounded-full" /> Execution Result
              </h4>

              <div className="flex-1 overflow-y-auto">
                {selectedNodeId && nodeResults[selectedNodeId] ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-white/5 font-mono text-[10px] text-emerald-400 break-all leading-relaxed animate-in fade-in slide-in-from-right-4 duration-500">
                      <pre>{JSON.stringify(nodeResults[selectedNodeId], null, 2)}</pre>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">This output was captured during the last test run.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 space-y-4 pt-20">
                    <div className="p-4 rounded-full bg-slate-800 border border-white/5"><Play className="w-6 h-6" /></div>
                    <p className="text-[10px] font-bold">Waiting for test run...</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-white/5">
                <Button variant="ghost" className="w-full gap-2 text-destructive hover:bg-destructive/10 uppercase font-black text-[10px] rounded-xl" onClick={() => { setNodes(nds => nds.filter(n => n.id !== selectedNodeId)); setSelectedNodeId(null); }}>
                  <Trash2 className="w-4 h-4" /> Delete Step
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edge Side Panel */}
      <Sheet open={!!selectedEdgeId} onOpenChange={(open) => !open && setSelectedEdgeId(null)}>
        <SheetContent className="bg-slate-950 border-l border-white/5">
          <SheetHeader className="pb-6 border-b border-white/5">
            <SheetTitle className="text-white font-black italic">Route Logic</SheetTitle>
          </SheetHeader>
          <div className="py-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-slate-500">Condition Equation</Label>
              <Input
                className="bg-slate-900 border-white/10 font-mono text-sm"
                placeholder="amount > 100"
                value={edges.find(e => e.id === selectedEdgeId)?.label as string || ''}
                onChange={(e) => setEdges(eds => eds.map(edge => edge.id === selectedEdgeId ? { ...edge, label: e.target.value } : edge))}
              />
              <p className="text-[10px] text-slate-500 italic">Example: status == 'approved' or total &lt; 50</p>
            </div>
            <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={() => { setEdges(eds => eds.filter(e => e.id !== selectedEdgeId)); setSelectedEdgeId(null); }}>Remove Connection</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* JSON Modal */}
      <Dialog open={isJsonModalOpen} onOpenChange={setIsJsonModalOpen}>
        <DialogContent className="max-w-2xl bg-slate-900/95 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle className="text-white font-black italic tracking-wide">Workflow Schema (JSON)</DialogTitle>
          </DialogHeader>
          <div className="relative group">
            <Textarea
              className="min-h-[400px] font-mono text-xs bg-slate-950 border-white/5 p-6 rounded-2xl text-emerald-400 focus-visible:ring-indigo-500/30 selection:bg-indigo-500/30 leading-relaxed resize-none scrollbar-thin scrollbar-thumb-white/10"
              value={jsonContent}
              onChange={e => setJsonContent(e.target.value)}
              spellCheck={false}
              placeholder="Paste your workflow JSON here..."
            />
            <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/5 group-hover:ring-white/10 transition-all" />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              className="gap-2 text-slate-400 hover:text-white hover:bg-white/5 font-bold uppercase text-[10px] tracking-widest"
              onClick={copyToClipboard}
            >
              <Copy className="h-3.5 w-3.5" /> Copy JSON
            </Button>
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => setIsJsonModalOpen(false)}
              className="border-white/10 text-slate-400 hover:bg-white/5 font-black uppercase text-[10px] rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportJson}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] rounded-xl px-8 shadow-lg shadow-indigo-500/20"
            >
              Build Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Assist Modal */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="sm:max-w-lg bg-slate-900 border-white/10 text-slate-100 rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter flex items-center gap-3 text-white">
              <div className="p-2 rounded-2xl bg-amber-500/20 ring-1 ring-amber-500/50">
                <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500/20" />
              </div>
              AI Workflow Architect
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest px-1">What process should I design?</Label>
              <Textarea
                placeholder="e.g., 'A 3-step expense approval flow where amounts over $500 go to the CFO, others to the Manager, and always notify Finance.'"
                className="min-h-[120px] bg-slate-950 border-white/5 text-slate-200 rounded-3xl p-6 focus-visible:ring-amber-500/50 resize-none leading-relaxed"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
              />
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3">
              <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/70 font-medium leading-relaxed uppercase tracking-tight">
                Premium Feature: Our Llama 3.1 engine will automatically provision nodes, define edges, and set conditional rules based on your request.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-900/20 gap-3 group"
              onClick={handleAiGenerate}
              disabled={isGenerating || !aiPrompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Architecting Workflow...
                </>
              ) : (
                <>
                  Generate Workflow
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}