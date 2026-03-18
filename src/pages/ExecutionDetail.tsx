import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useToast } from "@/hooks/use-toast";
import type { Workflow, SchemaField } from '@/types'


function StatusBadge({ children, variant }: { children: React.ReactNode, variant: string }) {
    const styles: Record<string, string> = {
        completed: "bg-success/15 text-success hover:bg-success/25 border-success/30",
        running: "bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-500/25 border-blue-500/30",
        failed: "bg-destructive/15 text-destructive hover:bg-destructive/25 border-destructive/30",
        pending: "bg-muted text-muted-foreground border-border",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border transition-colors cursor-default ${styles[variant] || styles.pending}`}>
            {children}
        </span>
    );
}

export default function ExecutionDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { toast } = useToast()
    const [execution, setExecution] = useState<any>(null)
    const [workflow, setWorkflow] = useState<Workflow | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedLog, setExpandedLog] = useState<string | null>(null)

    useEffect(() => {
        async function fetchExecution() {
            if (!id || !user) return

            const { data: exec } = await supabase
                .from('workflow_executions')
                .select('id, workflow_id, status, data, logs, triggered_by, started_at, ended_at, profiles:triggered_by(full_name)')
                .eq('id', id)
                .single()

            if (exec) {
                setExecution(exec)

                const { data: wf } = await supabase
                    .from('workflows')
                    .select('id, name, input_schema')
                    .eq('id', exec.workflow_id)
                    .single()

                if (wf) setWorkflow(wf)
            }
            setLoading(false)
        }

        fetchExecution()
    }, [id, user])

    async function handleCancel() {
        if (!id) return;
        try {
            await supabase.from('workflow_executions')
                .update({ status: 'canceled', ended_at: new Date().toISOString() } as any)
                .eq('id', id);
            toast({ title: "Execution Canceled" });
            window.location.reload();
        } catch (err: any) {
            console.error(err);
        }
    }

    async function handleRetry() {
        if (!id || !execution) return;
        try {
            const failedLog = (execution.logs || []).find((l: any) => l.status === 'failed');
            if (!failedLog) return;

            // In a real app, this would trigger an RPC or background worker
            // For now we navigate to the execution page to restart the sequence
            navigate(`/workflows/${execution.workflow_id}/execute`);
        } catch (err: any) {
            console.error(err);
        }
    }

    if (loading) {
        return <div className="p-8 max-w-5xl mx-auto"><p className="text-muted-foreground">Loading execution details...</p></div>
    }

    if (!execution) {
        return <div className="p-8 max-w-5xl mx-auto"><h2 className="text-xl font-bold">Execution not found</h2></div>
    }

    const inputData = execution?.data || {};
    const logs = execution?.logs || [];
    const schema = (workflow?.input_schema as SchemaField[]) || [];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-4 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Input Data */}
                <div className="flex-1 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl">{workflow?.name || 'Workflow Execution'}</CardTitle>
                                <CardDescription className="font-mono mt-1">{execution.id}</CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="flex gap-2">
                                    {execution.status === 'running' && (
                                        <Button variant="outline" size="sm" onClick={handleCancel} className="text-destructive h-7">Cancel</Button>
                                    )}
                                    {execution.status === 'failed' && (
                                        <Button variant="outline" size="sm" onClick={handleRetry} className="h-7">Retry</Button>
                                    )}
                                    <Badge variant="secondary" className="text-sm px-3 py-1">
                                        {execution.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Triggered by {execution.profiles?.full_name || 'System'}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b pb-2">Payload Data</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                                {schema.map((field) => (
                                    <div key={field.name} className="flex flex-col gap-1">
                                        <p className="text-sm text-muted-foreground">{field.name}</p>
                                        <p className="font-medium">
                                            {typeof inputData[field.name] === 'boolean'
                                                ? (inputData[field.name] ? 'True' : 'False')
                                                : (inputData[field.name]?.toString() || '—')}
                                        </p>
                                    </div>
                                ))}
                                {(!schema || schema.length === 0) && (
                                    <div className="col-span-full text-sm text-muted-foreground italic">No structured input schema found. Raw data: {JSON.stringify(inputData)}</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Audit Log Timeline */}
                <div className="w-full md:w-[450px]">
                    <div className="rounded-lg border border-border bg-card card-shadow">
                        <div className="border-b border-border px-6 py-4">
                            <h2 className="text-base font-semibold text-card-foreground">Execution Trace Logs</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {(!logs || logs.length === 0) && (
                                <div className="p-6 text-sm text-muted-foreground text-center">No logs generated yet.</div>
                            )}
                            {(logs || []).map((log: any) => (
                                <div key={log.id}>
                                    <button
                                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                        className="flex w-full items-center gap-3 px-6 py-4 text-left hover:bg-muted/50 transition-colors"
                                    >
                                        {expandedLog === log.id ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        <div className="flex-1 flex items-center gap-3">
                                            <span className="text-sm font-medium text-foreground">{log.step_name || log.stepName}</span>
                                            <StatusBadge variant={log.status}>{log.status}</StatusBadge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{log.timestamp?.slice(11, 19)}</span>
                                    </button>
                                    {expandedLog === log.id && (
                                        <div className="border-t border-border bg-muted/30 px-6 py-4 pl-14">
                                            <div className="space-y-2">
                                                <div>
                                                    <p className="text-xs font-medium text-muted-foreground">Rules Evaluated</p>
                                                    <div className="mt-1 space-y-1">
                                                        {log.evaluated_rules?.map((e: any, i: number) => (
                                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                                <code className="flex-1 rounded bg-background px-2 py-1 text-foreground">{e.rule}</code>
                                                                <span>{e.result ? '✅' : '❌'}</span>
                                                            </div>
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
            </div>
        </div>
    )
}
