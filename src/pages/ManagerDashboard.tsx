import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, CheckCircle, AlertTriangle, PlayCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function ManagerDashboard() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [executions, setExecutions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTeamExecutions() {
            if (!user) return

            // 1. Get manager's company ID
            const { data: userData } = await supabase
                .from('company_users')
                .select('company_id')
                .eq('user_id', user.id)
                .single()

            const companyId = (userData as any)?.company_id

            if (companyId) {
                // 2. Fetch executions for that company
                const { data } = await supabase
                    .from('workflow_executions')
                    .select('*, profiles!triggered_by(full_name, email), workflows!inner(name, company_id)')
                    .eq('workflows.company_id', companyId)
                    .order('created_at', { ascending: false })

                if (data) {
                    setExecutions(data as any[])
                }
            }
            setLoading(false)
        }

        fetchTeamExecutions()
    }, [user])

    const runningCount = executions.filter(e => e.status === 'running').length;
    const completedCount = executions.filter(e => e.status === 'completed').length;
    const failedCount = executions.filter(e => e.status === 'failed').length;

    if (loading) {
        return <div className="p-8 max-w-full"><p className="text-muted-foreground">Loading dashboard...</p></div>
    }

    return (
        <div className="p-8 max-w-full space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
                <p className="text-muted-foreground mt-1">Review team workflow executions and action items.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:border-amber-500 transition-colors" onClick={() => navigate('/manager/action-items')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Action Items</CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{runningCount}</div>
                        <p className="text-xs text-muted-foreground mt-1 underline decoration-dotted">Review active workflows</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-green-600 transition-colors" onClick={() => navigate('/manager/team-executions')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Executions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">{completedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Fully automated logic runs</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-red-500 transition-colors" onClick={() => navigate('/manager/team-executions')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Failed Workflows</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{failedCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">Requires investigation</p>
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/manager/team-executions')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Team Volume</CardTitle>
                        <PlayCircle className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{executions.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Total runtime invocations</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="running" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="running">Running ({runningCount})</TabsTrigger>
                    <TabsTrigger value="all">All Executions</TabsTrigger>
                </TabsList>

                <TabsContent value="running">
                    <Card>
                        <CardHeader>
                            <CardTitle>Action Items</CardTitle>
                            <CardDescription>Workflows active right now.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Triggered By</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Workflow</th>
                                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {executions.filter(e => e.status === 'running').map((exec) => (
                                            <tr key={exec.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4 font-medium whitespace-nowrap">{exec.profiles?.full_name || 'System Auto'}</td>
                                                <td className="px-4 py-4 whitespace-nowrap">{new Date(exec.created_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-4">
                                                    <div className="font-medium text-foreground">{exec.workflows?.name}</div>
                                                </td>
                                                <td className="px-4 py-4 space-x-2 text-right whitespace-nowrap">
                                                    <Button size="sm" variant="outline" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => navigate(`/executions/detail/${exec.id}`)}>Review Data</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Execution History</CardTitle>
                            <CardDescription>All historical runs from your direct reports.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Triggered By</th>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium">Workflow</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {executions.map((exec) => (
                                            <tr key={exec.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium whitespace-nowrap">{exec.profiles?.full_name || 'System Auto'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">{new Date(exec.created_at).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 min-w-[200px]">{exec.workflows?.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <Badge className={exec.status === 'completed' ? 'bg-green-100 text-green-800' : exec.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'} variant="secondary">
                                                        {exec.status.charAt(0).toUpperCase() + exec.status.slice(1)}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
