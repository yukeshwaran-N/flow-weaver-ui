
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Building2, TrendingUp, Users, DollarSign } from 'lucide-react'

type Expense = {
    id: string;
    amount: number;
    category: string;
    description: string;
    status: string;
    created_at: string;
    employee_id: string;
}

export default function ManagerReports() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalSpending: 0,
        avgExpense: 0,
        teamSize: 0,
        pendingAmount: 0
    })
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [monthlyData, setMonthlyData] = useState<any[]>([])

    useEffect(() => {
        async function fetchReportData() {
            if (!user) return

            const { data: userData } = await supabase
                .from('company_users')
                .select('company_id')
                .eq('user_id', user.id)
                .single()

            const companyId = (userData as any)?.company_id

            if (companyId) {
                const { data } = await supabase
                    .from('expenses')
                    .select('id, amount, category, description, status, created_at, employee_id, company_id')
                    .eq('company_id', companyId)

                const expenses = data as Expense[] | null

                if (expenses) {
                    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
                    const pending = expenses.filter(e => e.status === 'submitted' || e.status === 'pending' || e.status === 'pending_manager' || e.status === 'pending_ceo')
                        .reduce((sum, e) => sum + e.amount, 0)
                    const empIds = [...new Set(expenses.map(e => e.employee_id))]

                    setStats({
                        totalSpending: total,
                        avgExpense: expenses.length ? total / expenses.length : 0,
                        teamSize: empIds.length,
                        pendingAmount: pending
                    })

                    // Category data
                    const categories: any = {}
                    expenses.forEach(e => {
                        categories[e.category] = (categories[e.category] || 0) + e.amount
                    })
                    setCategoryData(Object.entries(categories).map(([name, value]) => ({ name, value })))

                    // Monthly data (simulated for now based on created_at)
                    const months: any = {}
                    expenses.forEach(e => {
                        const month = new Date(e.created_at).toLocaleString('default', { month: 'short' })
                        months[month] = (months[month] || 0) + e.amount
                    })
                    setMonthlyData(Object.entries(months).map(([name, amount]) => ({ name, amount })))
                }
            }
            setLoading(false)
        }
        fetchReportData()
    }, [user])

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div className="p-8">Loading reports...</div>

    return (
        <div className="p-8 max-w-full space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Reports</h1>
                <p className="text-muted-foreground mt-1">Analytical overview of team spending and budget utilization.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" /> Total Managed Spending
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">${stats.totalSpending.toLocaleString()}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" /> Average Request
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">${stats.avgExpense.toFixed(2)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Team Size
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">{stats.teamSize} Members</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" /> Efficiency Score
                        </CardDescription>
                        <CardTitle className="text-2xl font-bold">94%</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="shadow-lg border-muted/50">
                    <CardHeader>
                        <CardTitle>Spending Trends</CardTitle>
                        <CardDescription>Monthly expenditure across all categories</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-muted/50">
                    <CardHeader>
                        <CardTitle>Expense Distribution</CardTitle>
                        <CardDescription>Spending breakdown by category</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {categoryData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs font-medium">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="capitalize">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
