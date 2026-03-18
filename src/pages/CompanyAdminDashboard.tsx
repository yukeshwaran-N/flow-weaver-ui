import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WorkflowIcon, Users, PlayCircle, CheckCircle, Settings, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/hooks/useCompany'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts'

const monthlyData = [
    { name: 'Jan', amount: 12 },
    { name: 'Feb', amount: 45 },
    { name: 'Mar', amount: 78 },
    { name: 'Apr', amount: 140 },
    { name: 'May', amount: 220 },
    { name: 'Jun', amount: 280 },
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function CompanyAdminDashboard() {
    const navigate = useNavigate()
    const { company } = useCompany()

    const [stats, setStats] = useState({
        totalWorkflows: 0,
        runningExecutions: 0,
        completedExecutions: 0,
        successRate: 0,
        statusDistribution: [] as any[]
    })

    useEffect(() => {
        if (company) loadStats()
    }, [company])

    async function loadStats() {
        try {
            // Count active workflows
            const { count: workflowsCount } = await supabase
                .from('workflows')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company?.id || '')
                .eq('is_active', true)

            // Get all executions
            const { data: executions } = await supabase
                .from('workflow_executions')
                .select('status, workflows!inner(company_id)')
                .eq('workflows.company_id', company?.id || '')

            if (!executions) return;

            let running = 0;
            let completed = 0;
            let failed = 0;

            executions.forEach(e => {
                if (e.status === 'running') running++;
                if (e.status === 'completed') completed++;
                if (e.status === 'failed') failed++;
            });

            const totalFinished = completed + failed;
            const successRate = totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 100;

            const dist = [
                { name: 'Running', value: running },
                { name: 'Completed', value: completed },
                { name: 'Failed', value: failed }
            ].filter(d => d.value > 0);

            setStats({
                totalWorkflows: workflowsCount || 0,
                runningExecutions: running,
                completedExecutions: completed,
                successRate,
                statusDistribution: dist.length > 0 ? dist : [{ name: 'No Data', value: 1 }]
            })
        } catch (e) {
            console.error(e)
        }
    }

    return (
        <div className="p-8 max-w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{company?.name || 'Company'} Workspace</h1>
                    <p className="text-muted-foreground mt-1">Global view of all workflow automation activity.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/admin/settings')}>
                        <Settings className="w-4 h-4" /> Workspace Settings
                    </Button>
                    <Button className="gap-2" onClick={() => navigate('/admin/employees')}>
                        <Users className="w-4 h-4" /> Manage Roster
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                        <WorkflowIcon className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalWorkflows}</div>
                        <p className="text-xs text-muted-foreground mt-1">Deployed templates</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Running Executions</CardTitle>
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.runningExecutions}</div>
                        <p className="text-xs text-muted-foreground mt-1">Currently active tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Executions</CardTitle>
                        <CheckCircle className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">{stats.completedExecutions}</div>
                        <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Execution Success Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.successRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Completed vs Failed</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Execution Volume</CardTitle>
                        <CardDescription>Total workflows executed over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <RechartsTooltip formatter={(value: number) => [`${value}`, 'Executions']} />
                                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Execution Status Distribution</CardTitle>
                        <CardDescription>Breakdown of all workflow execution states</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.statusDistribution.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip formatter={(value: number) => [`${value}`, 'Executions']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end mt-8">
                <Button onClick={() => navigate('/admin/workflows')} size="lg" className="w-full sm:w-auto">Manage Workflows</Button>
            </div>
        </div>
    )
}
