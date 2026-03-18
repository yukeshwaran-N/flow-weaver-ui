import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function TeamExpenses() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [executions, setExecutions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        async function fetchExecutions() {
            if (!user) return

            const { data } = await supabase
                .from('workflow_executions')
                .select('*, profiles!triggered_by(full_name, email), workflows!inner(name)')
                .order('created_at', { ascending: false })

            if (data) setExecutions(data as any[])

            setLoading(false)
        }
        fetchExecutions()
    }, [user])

    const filtered = executions.filter(exec => {
        const matchesSearch =
            (exec.workflows?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            exec.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || exec.status === statusFilter

        return matchesSearch && matchesStatus
    })

    if (loading) return <div className="p-8">Loading team executions...</div>

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Executions</h1>
                    <p className="text-muted-foreground mt-1">Monitor all workflow executions across your team.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by workflow name or employee..."
                        className="pl-9 h-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('all')}
                    >All</Button>
                    <Button
                        variant={statusFilter === 'running' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('running')}
                    >Running</Button>
                    <Button
                        variant={statusFilter === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter('completed')}
                    >Completed</Button>
                </div>
            </div>

            <Card className="border-border/60 shadow-md">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg">Execution Log</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Employee</th>
                                    <th className="px-6 py-4 font-semibold">Date</th>
                                    <th className="px-6 py-4 font-semibold">Workflow</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filtered.map((exec) => (
                                    <tr key={exec.id} className="hover:bg-muted/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{exec.profiles?.full_name || 'System Auto'}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{exec.profiles?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {new Date(exec.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-foreground font-medium">{exec.workflows?.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{exec.id.slice(0, 8)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                className={
                                                    exec.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        exec.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                            'bg-blue-100 text-blue-800'
                                                }
                                                variant="secondary"
                                            >
                                                {exec.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => navigate(`/executions/detail/${exec.id}`)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" /> Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            No executions found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
