import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Play, ArrowLeft, WorkflowIcon, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/hooks/useCompany'
import type { Workflow } from '@/types'

export default function StartWorkflow() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { company } = useCompany()

    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (company) {
            loadWorkflows()
        }
    }, [company])

    async function loadWorkflows() {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('workflows')
                .select('id, name, description, is_active, version, created_at')
                .eq('company_id', company?.id || '')
                .eq('is_active', true)
                .order('name', { ascending: true })

            if (error) throw error
            setWorkflows(data || [])
        } catch (error: any) {
            toast({
                title: "Error fetching workflows",
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 max-w-full space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-4 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back
            </Button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Start Workflow</h1>
                <p className="text-muted-foreground mt-1">Select an active workflow template to execute a new task.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading && (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        Loading available workflows...
                    </div>
                )}

                {!loading && workflows.length === 0 && (
                    <div className="col-span-full py-16 text-center bg-card border rounded-xl border-dashed flex flex-col items-center gap-4 bg-muted/10">
                        <div className="p-4 bg-background rounded-full border border-dashed text-muted-foreground/40">
                            <WorkflowIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-foreground">No active workflows available</p>
                            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                                Start by creating a workflow template or contact your Admin to activate existing ones.
                            </p>
                        </div>
                        <Button onClick={() => navigate('/workflows/new')} className="gap-2 mt-2">
                            <Plus className="w-4 h-4" /> Create My First Workflow
                        </Button>
                    </div>
                )}

                {!loading && Array.isArray(workflows) && workflows.map((w) => (
                    <Card key={w.id} className="hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate(`/executions/run/${w.id}`)}>
                        <CardHeader className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                                    <WorkflowIcon className="w-6 h-6" />
                                </div>
                                <Button size="sm" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5 h-8">
                                    <Play className="w-3.5 h-3.5" /> Start
                                </Button>
                            </div>
                            <div>
                                <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">{w.name}</CardTitle>
                                <CardDescription className="line-clamp-2 mt-1.5 h-10">
                                    {w.description || "No description provided."}
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
