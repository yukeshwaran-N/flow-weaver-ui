import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserPlus, Search, Filter, MoreHorizontal, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUserRole } from '@/hooks/useUserRole'

type RosterMember = {
    user_id: string;
    role: string;
    profile: {
        full_name: string;
        email: string;
    };
    manager_id?: string;
    manager?: {
        full_name: string;
    };
    status: string;
}

export default function ManageRoster() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const { user } = useAuth()
    const { role: currentUserRole } = useUserRole()

    const [searchTerm, setSearchTerm] = useState('')
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviteRole, setInviteRole] = useState('employee')
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteManager, setInviteManager] = useState<string>('none')
    const [roster, setRoster] = useState<RosterMember[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    async function fetchRoster() {
        if (!user) return
        setLoading(true)

        try {
            // 1. Get current user's company
            const { data: userCompany } = await (supabase
                .from('company_users')
                .select('company_id')
                .eq('user_id', user.id)
                .single() as any)

            if (!userCompany) return

            const companyId = userCompany.company_id

            // 2. Fetch all users in that company
            const { data: companyUsers, error } = await supabase
                .from('company_users')
                .select(`
                    user_id,
                    role,
                    status,
                    manager_id
                `)
                .eq('company_id', companyId)

            if (error) throw error
            if (!companyUsers || companyUsers.length === 0) {
                setRoster([])
                return
            }

            // 3. Fetch all related profiles
            const userIds = companyUsers.map((u: any) => u.user_id)
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds)

            const profileMap = profiles?.reduce((acc: any, p: any) => ({
                ...acc,
                [p.id]: { full_name: p.full_name, email: p.email }
            }), {}) || {}

            // 4. Build manager map
            const managerIds = [...new Set(companyUsers.map((d: any) => d.manager_id).filter(Boolean))]
            let managerMap: Record<string, string> = {}

            if (managerIds.length > 0) {
                const { data: managers } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', managerIds)

                managerMap = managers?.reduce((acc: any, m: any) => ({ ...acc, [m.id]: m.full_name }), {}) || {}
            }

            setRoster(companyUsers.map((item: any) => ({
                user_id: item.user_id,
                role: item.role,
                status: item.status || 'active',
                manager_id: item.manager_id,
                profile: profileMap[item.user_id] || { full_name: 'Unknown', email: 'unknown@example.com' },
                manager: item.manager_id ? { full_name: managerMap[item.manager_id] || 'Unknown' } : undefined
            })))
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoster()
    }, [user])

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        setSubmitting(true)

        try {
            // 1. Find user profile by email
            const { data: targetProfile, error: profileError } = await (supabase
                .from('profiles')
                .select('id, full_name')
                .eq('email', inviteEmail)
                .single() as any)

            if (profileError || !targetProfile) {
                throw new Error("User not found. They must register for an account first.")
            }

            // 2. Get current admin's company
            const { data: adminLink } = await (supabase
                .from('company_users')
                .select('company_id')
                .eq('user_id', user.id)
                .single() as any)

            const companyId = adminLink?.company_id

            // 3. Create or update company user link
            const { error: linkError } = await (supabase
                .from('company_users')
                .upsert({
                    company_id: companyId,
                    user_id: targetProfile.id,
                    role: inviteRole,
                    manager_id: inviteManager === 'none' ? null : inviteManager,
                    status: 'active'
                } as any) as any)

            if (linkError) throw linkError

            toast({
                title: "Member Added",
                description: `${targetProfile.full_name} has been added to the organization.`
            })

            setIsInviteOpen(false)
            setInviteEmail('')
            setInviteRole('employee')
            setInviteManager('none')
            fetchRoster()
        } catch (error: any) {
            toast({
                title: "Failed to add member",
                description: error.message,
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    const filtered = roster.filter(r =>
        r.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const managers = roster.filter(r => r.role === 'manager' || r.role === 'company_admin')

    return (
        <div className="p-8 max-w-full space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-4 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Organization Roster</h1>
                    <p className="text-muted-foreground mt-1 text-base">Directly add registered users to your organization and assign roles.</p>
                </div>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 shrink-0 h-11 px-5 shadow-lg shadow-primary/20">
                            <UserPlus className="w-5 h-5" /> Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <form onSubmit={handleAddMember}>
                            <DialogHeader>
                                <DialogTitle>Add New Member</DialogTitle>
                                <DialogDescription>
                                    Assign a registered user to your company. Enter the email address they used to sign up.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-5 py-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-semibold">User Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="jane.doe@company.com"
                                        className="h-11"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="role" className="text-sm font-semibold">Role assignment</Label>
                                    <Select value={inviteRole} onValueChange={setInviteRole}>
                                        <SelectTrigger id="role" className="h-11">
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Employee</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                            {currentUserRole === 'company_admin' && (
                                                <SelectItem value="company_admin">Admin</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="manager" className="text-sm font-semibold">Reports To (Optional)</Label>
                                    <Select value={inviteManager} onValueChange={setInviteManager}>
                                        <SelectTrigger id="manager" className="h-11">
                                            <SelectValue placeholder="Select a manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No direct manager</SelectItem>
                                            {managers.map(m => (
                                                <SelectItem key={m.user_id} value={m.user_id}>{m.profile?.full_name || 'Unnamed Manager'}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" className="w-full h-11" disabled={submitting}>
                                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</> : 'Add to Organization'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-border/60 shadow-xl overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 pb-6 border-b bg-muted/20">
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search namesake or email..."
                                className="pl-10 h-10 w-[250px] lg:w-[400px] border-border/60"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground bg-white px-3 py-1 rounded-full border border-border/50">
                        {filtered.length} total members
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] tracking-wider font-bold">
                                <tr>
                                    <th className="px-6 py-4 border-b">Member Profile</th>
                                    <th className="px-6 py-4 border-b">Company Role</th>
                                    <th className="px-6 py-4 border-b">Reports To</th>
                                    <th className="px-6 py-4 border-b">Onboarding Status</th>
                                    <th className="px-6 py-4 border-b text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                                <span>Fetching organizational data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.map((member) => (
                                    <tr key={member.user_id} className="hover:bg-muted/20 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {(member.profile?.full_name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground text-sm leading-none">{member.profile?.full_name || 'Unnamed User'}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 font-mono tracking-tight">{member.profile?.email || 'No email available'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge variant="outline" className={`
                                                capitalize px-2.5 py-0.5 font-medium
                                                ${member.role === 'manager' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    member.role === 'company_admin' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-slate-50 text-slate-700 border-slate-200'}
                                            `}>
                                                {member.role.replace('_', ' ')}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5">
                                            {member.manager ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                                    <span className="text-muted-foreground font-medium">{member.manager.full_name}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground/60 italic text-xs">No direct manager</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <Badge variant={member.status === 'active' ? 'default' : member.status === 'invited' ? 'secondary' : 'destructive'}
                                                className={`
                                                    font-semibold px-3 py-1 rounded-md
                                                    ${member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                                                `}>
                                                {member.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search className="h-8 w-8 opacity-20" />
                                                <p>No organizational members found matching "{searchTerm}"</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/10 px-6 py-4 text-xs font-medium text-muted-foreground flex justify-between">
                    <div>Showing {filtered.length} employees</div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="h-8 bg-white" disabled>Previous</Button>
                        <Button variant="outline" size="sm" className="h-8 bg-white" disabled>Next</Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
