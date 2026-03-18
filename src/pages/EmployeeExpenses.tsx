import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search, Filter, MoreHorizontal, FileText, CheckCircle2, Clock, XCircle, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function EmployeeExpenses() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [executions, setExecutions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function fetchExecutions() {
            if (!user) return
            setLoading(true)

            const { data, error } = await supabase
                .from('workflow_executions')
                .select(`
                    id,
                    status,
                    created_at,
                    data,
                    workflows (
                        name
                    )
                `)
                .eq('triggered_by', user.id)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setExecutions(data)
            }
            setLoading(false)
        }

        fetchExecutions()
    }, [user])

    const filtered = executions.filter(exec =>
        (exec.workflows?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        exec.id.includes(searchTerm)
    )

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
            case 'running': return <Play className="w-4 h-4 text-blue-500" />
            default: return <Clock className="w-4 h-4 text-amber-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800'
            case 'failed': return 'bg-red-100 text-red-800'
            case 'running': return 'bg-blue-100 text-blue-800'
            default: return 'bg-amber-100 text-amber-800'
        }
    }

    return (
        <div className="p-8 max-w-full space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-4 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Executions</h1>
                    <p className="text-muted-foreground mt-1">Review the status and history of workflows you've started.</p>
                </div>
                <Button onClick={() => navigate('/executions/new')} className="gap-2 shrink-0">
                    <Play className="w-4 h-4" /> Start New
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 pb-4 border-b">
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search workflows, ID..."
                                className="pl-8 w-[250px] lg:w-[350px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] sm:text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date & ID</th>
                                    <th className="px-6 py-4 font-medium">Workflow</th>
                                    <th className="px-6 py-4 font-medium">Input Data Summary</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y relative">
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading executions...</td>
                                    </tr>
                                )}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">No executions found matching "{searchTerm}"</td>
                                    </tr>
                                )}
                                {!loading && filtered.map((exec) => (
                                    <tr key={exec.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium whitespace-nowrap">
                                                {new Date(exec.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                                {exec.id.slice(0, 8)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-sm">
                                            <div className="font-medium capitalize">{exec.workflows?.name || 'Unknown Workflow'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono max-w-xs truncate">
                                            {exec.data ? JSON.stringify(exec.data).substring(0, 50) + '...' : '{}'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={`capitalize flex w-fit items-center gap-1.5 ${getStatusBadge(exec.status)}`}>
                                                {getStatusIcon(exec.status)}
                                                {exec.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/executions/detail/${exec.id}`)}>
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
