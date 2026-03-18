import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Activity, Plus, Settings, Shield, RefreshCw, Copy, CheckCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

type Application = {
    id: string;
    email: string;
    full_name: string;
    company_name: string;
    company_type: string;
    location: string;
    mobile: string;
    employee_count: number;
    department_count: number;
    website_url: string;
    status: string;
    applied_at: string;
}

type Company = {
    id: string;
    name: string;
    subscription_tier: string;
    status: string;
    admin_email: string;
    employee_count: number;
    onboarding_questions: any;
    created_at: string;
}

export default function PlatformDashboard() {
    const { toast } = useToast()
    const [isAddTenantOpen, setIsAddTenantOpen] = useState(false)
    const [tenantName, setTenantName] = useState('')
    const [tenants, setTenants] = useState<Company[]>([])
    const [applications, setApplications] = useState<Application[]>([])
    const [loading, setLoading] = useState(false)
    const [approvalResult, setApprovalResult] = useState<{ email: string; pass: string } | null>(null)
    const [editingTenant, setEditingTenant] = useState<Company | null>(null)

    async function fetchData() {
        setLoading(true)
        try {
            const { data: companies } = await supabase
                .from('companies')
                .select('id, name, subscription_tier, status, admin_email, created_at')
                .order('created_at', { ascending: false })

            const { data: apps } = await supabase
                .from('company_applications')
                .select('id, email, full_name, company_name, company_type, location, mobile, employee_count, department_count, website_url, status, applied_at')
                .order('applied_at', { ascending: false })

            if (companies) setTenants(companies as Company[])
            if (apps) setApplications(apps as Application[])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleAddTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await (supabase
            .from('companies') as any)
            .insert([{ name: tenantName, status: 'active', subscription_tier: 'free' }])

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
            return
        }

        toast({ title: "Tenant Created", description: `Successfully provisioned workspace for ${tenantName}.` })
        setIsAddTenantOpen(false)
        setTenantName('')
        fetchData()
    }

    const handleUpdateTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingTenant) return

        setLoading(true)
        const { error } = await (supabase.from('companies') as any)
            .update({
                name: editingTenant.name,
                status: editingTenant.status,
                subscription_tier: editingTenant.subscription_tier
            })
            .eq('id', editingTenant.id)
        setLoading(false)

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } else {
            toast({ title: "Workspace Updated", description: "Successfully updated tenant settings." })
            setEditingTenant(null)
            fetchData()
        }
    }

    const handleApprove = async (app: Application) => {
        setLoading(true)
        const tempPass = `FW-${Math.random().toString(36).slice(-6).toUpperCase()}`
        try {
            const { error } = await (supabase.rpc as any)('admin_approve_application', {
                p_application_id: app.id,
                p_temp_password: tempPass
            })
            if (error) throw error

            setApprovalResult({ email: app.email, pass: tempPass })
            fetchData()
        } catch (error: any) {
            toast({ title: 'Approval Failed', description: error.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleReject = async (id: string) => {
        const { error } = await (supabase.from('company_applications') as any)
            .update({ status: 'rejected' })
            .eq('id', id)

        if (error) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' })
        } else {
            fetchData()
        }
    }

    return (
        <div className="p-8 max-w-full space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[#0D1B2A]">Platform Command Center</h1>
                    <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
                        <Shield className="w-3 h-3 text-primary" />
                        System Administration
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" className="gap-2 h-11 px-4 bg-white" onClick={() => {
                        console.log('Syncing data...');
                        fetchData();
                        toast({ title: "Refreshing", description: "Fetching latest platform data..." });
                    }} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Sync Data
                    </Button>
                    <Dialog open={isAddTenantOpen} onOpenChange={setIsAddTenantOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 h-11 px-6 shadow-lg shadow-primary/10">
                                <Plus className="w-4 h-4" /> Provision Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl border-none shadow-2xl">
                            <form onSubmit={handleAddTenant}>
                                <DialogHeader>
                                    <DialogTitle>Create New Workspace (Tenant)</DialogTitle>
                                    <DialogDescription>Set up a new isolated environment for a company.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Company Name</Label>
                                        <Input id="name" required value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="e.g. Initech LLC" />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Deploy Schema & Setup</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                        <Building2 className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications.filter(a => a.status === 'pending').length}</div>
                        <p className="text-xs text-muted-foreground mt-1">New company applications</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenants.length * 5}</div>
                        <p className="text-xs text-muted-foreground mt-1">Estimated total users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Provisioned</CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{tenants.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Active company workspaces</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Health</CardTitle>
                        <Shield className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100%</div>
                        <p className="text-xs text-muted-foreground mt-1">All services online</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6 mt-8">
                <Card className="border-none shadow-xl shadow-blue-900/5 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold">Registration Requests</CardTitle>
                                <CardDescription>Review and approve incoming company registrations.</CardDescription>
                            </div>
                            <Badge className="bg-orange-100 text-orange-700">
                                {applications.filter(a => a.status === 'pending').length} PENDING
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Company</th>
                                        <th className="px-4 py-3 font-medium">Lead Admin</th>
                                        <th className="px-4 py-3 font-medium">Size</th>
                                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {applications.filter(a => a.status === 'pending').map((app) => (
                                        <tr key={app.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-4 font-medium">{app.company_name}</td>
                                            <td className="px-4 py-4 text-muted-foreground">{app.email}</td>
                                            <td className="px-4 py-4">{app.employee_count} emp</td>
                                            <td className="px-4 py-4 text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button size="sm" variant="outline">Review</Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-[500px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Application: {app.company_name}</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="space-y-4 py-4">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground uppercase">Admin</p>
                                                                    <p>{app.full_name}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground uppercase">Email</p>
                                                                    <p>{app.email}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DialogFooter className="gap-2">
                                                            <Button type="button" variant="outline" className="text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleReject(app.id)}>Reject</Button>
                                                            <Button type="button" className="bg-green-600 hover:bg-green-700 border-none" onClick={() => handleApprove(app)}>Approve & Setup</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-blue-900/5">
                    <CardHeader className="bg-slate-50/50 border-b px-6 py-4">
                        <CardTitle className="text-lg font-bold">Active Workspaces</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Workspace</th>
                                        <th className="px-4 py-3 font-medium">Lead Admin</th>
                                        <th className="px-4 py-3 font-medium text-right">Settings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {tenants.map((tenant) => (
                                        <tr key={tenant.id} className="hover:bg-muted/30">
                                            <td className="px-4 py-4 font-medium">{tenant.name}</td>
                                            <td className="px-4 py-4 text-muted-foreground">{tenant.admin_email}</td>
                                            <td className="px-4 py-4 text-right">
                                                <Button size="icon" variant="ghost" onClick={() => setEditingTenant(tenant)}><Settings className="w-4 h-4" /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!editingTenant} onOpenChange={(open) => !open && setEditingTenant(null)}>
                <DialogContent className="sm:max-w-[420px] rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle>Workspace Settings</DialogTitle>
                        <DialogDescription>Manage configuration for {editingTenant?.name}.</DialogDescription>
                    </DialogHeader>
                    {editingTenant && (
                        <form onSubmit={handleUpdateTenant} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Workspace Name</Label>
                                <Input
                                    value={editingTenant.name}
                                    onChange={e => setEditingTenant({ ...editingTenant, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select
                                        value={editingTenant.status}
                                        onValueChange={(v) => setEditingTenant({ ...editingTenant, status: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Subscription Tier</Label>
                                    <Select
                                        value={editingTenant.subscription_tier || 'free'}
                                        onValueChange={(v) => setEditingTenant({ ...editingTenant, subscription_tier: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">Free</SelectItem>
                                            <SelectItem value="starter">Starter</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!approvalResult} onOpenChange={(open) => !open && setApprovalResult(null)}>
                <DialogContent className="sm:max-w-[400px] border-none shadow-2xl overflow-hidden rounded-3xl p-0">
                    <div className="bg-green-600 p-8 text-white flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-xl">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">Access Granted!</h2>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-slate-400">Admin Email</Label>
                                <div className="bg-slate-50 border rounded-xl p-3 flex items-center justify-between">
                                    <span className="text-sm font-semibold">{approvalResult?.email}</span>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        navigator.clipboard.writeText(approvalResult?.email || '');
                                        toast({ title: 'Copied Email' });
                                    }}><Copy className="w-4 h-4" /></Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-slate-400">Temporary Password</Label>
                                <div className="bg-slate-50 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
                                    <span className="text-lg font-black text-primary">{approvalResult?.pass}</span>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        navigator.clipboard.writeText(approvalResult?.pass || '');
                                        toast({ title: 'Copied Password' });
                                    }}><Copy className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        </div>
                        <Button type="button" className="w-full h-12 rounded-xl bg-slate-900" onClick={() => setApprovalResult(null)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
