import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Shield, Key, Eye, EyeOff, Loader2 } from 'lucide-react'

export function PasswordChangeInterceptor({ userId }: { userId?: string }) {
    const { toast } = useToast()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast({ title: 'Passwords mismatch', description: 'Please ensure both passwords are identical.', variant: 'destructive' })
            return
        }

        if (newPassword.length < 6) {
            toast({ title: 'Password too weak', description: 'Password must be at least 6 characters long.', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            // 1. Update the password via Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: newPassword
            })

            if (authError) throw authError

            // 2. Clear the flag in profiles
            const { error: profileError } = await (supabase
                .from('profiles') as any)
                .update({ must_change_password: false })
                .eq('id', userId)

            if (profileError) throw profileError

            toast({ title: 'Success', description: 'Your password has been updated. Welcome to Flow Weaver!' })

            // Force a reload to refresh the state in useUserRole
            window.location.reload()
        } catch (error: any) {
            toast({ title: 'Update failed', description: error.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-md border-none shadow-2xl animate-in fade-in zoom-in duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Security Update Required</CardTitle>
                    <CardDescription>
                        This is your first login with temporary credentials. Please set a secure password to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    className="pl-10"
                                    placeholder="••••••••"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <ul className="text-[11px] text-muted-foreground space-y-1 pl-4 list-disc bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <li>Minimum 6 characters</li>
                            <li>Include at least one number</li>
                            <li>Avoid using common words</li>
                        </ul>

                        <Button type="submit" className="w-full h-11" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Secure Account & Enter Dashboard
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
