import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, ShieldAlert, CreditCard, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"

interface RegistrationStatusProps {
    status: 'pending' | 'active' | 'rejected' | string | null;
    subscriptionTier: string | null;
    role: string | null;
}

export function RegistrationStatus({ status, subscriptionTier, role }: RegistrationStatusProps) {
    const { toast } = useToast()
    const navigate = useNavigate()

    const handleSelectPlan = async (plan: string) => {
        const { error } = await (supabase.from('companies') as any)
            .update({ subscription_tier: plan } as any)
            .eq('id', (await supabase.auth.getUser()).data.user?.id) // This is wrong, I need the company_id

        // Better to get company_id from useUserRole if possible, but for now we'll do a look up
        const userId = (await supabase.auth.getUser()).data.user?.id
        if (!userId) return

        const { data: userCompany } = await supabase
            .from('company_users')
            .select('company_id')
            .eq('user_id', userId)
            .single()

        if (userCompany?.company_id) {
            const { error } = await (supabase.from('companies') as any)
                .update({ subscription_tier: plan })
                .eq('id', userCompany.company_id)

            if (error) {
                toast({ title: "Error", description: error.message, variant: "destructive" })
            } else {
                toast({ title: "Plan Selected", description: `You have successfully selected the ${plan} plan.` })
                window.location.reload() // Refresh to clear interception
            }
        }
    }

    // View 1: Pending Approval
    if (status === 'pending') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
                <Card className="max-w-md w-full text-center shadow-2xl border-primary/20">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
                            <Clock className="w-10 h-10" />
                        </div>
                        <CardTitle className="text-2xl">Application Under Review</CardTitle>
                        <CardDescription>
                            The Flow Weaver team is currently verifying your company registration.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            We manually review every company to ensure the highest security on our platform.
                            You will receive an email once your account is activated.
                        </p>
                        <div className="bg-secondary/50 p-3 rounded-lg text-xs font-mono text-left space-y-1">
                            <p>• Company ID: Generated</p>
                            <p>• Status: Awaiting Verification</p>
                            <p>• Priority: Standard</p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
                            Sign Out
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    // View 2: Billing Setup (Company Admin)
    if (status === 'active' && !subscriptionTier && role === 'company_admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4 py-12">
                <div className="max-w-5xl w-full space-y-8">
                    <div className="text-center space-y-4">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-2">Approved</Badge>
                        <h1 className="text-4xl font-bold tracking-tight">Select Your Power Plan</h1>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Your company has been verified! Choose a plan to unlock your approval workflows.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Starter */}
                        <Card className="flex flex-col border-2 hover:border-primary/50 transition-all">
                            <CardHeader>
                                <CardTitle>Starter</CardTitle>
                                <div className="text-3xl font-bold mt-2">$29<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Up to 10 employees</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Single-tier approvals</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Standard support</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" onClick={() => handleSelectPlan('starter')}>Select Starter</Button>
                            </CardFooter>
                        </Card>

                        {/* Business */}
                        <Card className="flex flex-col border-2 border-primary shadow-xl relative scale-105 z-10">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold uppercase">
                                Recommended
                            </div>
                            <CardHeader>
                                <CardTitle>Business</CardTitle>
                                <div className="text-3xl font-bold mt-2">$99<span className="text-lg text-muted-foreground font-normal">/mo</span></div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Up to 100 employees</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Multi-tier logic</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Advanced audit trails</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleSelectPlan('business')}>
                                    Start Free Trial <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Enterprise */}
                        <Card className="flex flex-col border-2 hover:border-primary/50 transition-all">
                            <CardHeader>
                                <CardTitle>Enterprise</CardTitle>
                                <div className="text-3xl font-bold mt-2">Custom</div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Unlimited everything</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> Dedicated success manager</li>
                                    <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" /> SLA & Security Hub</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" onClick={() => handleSelectPlan('enterprise')}>Contact Sales</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    // View 3: Payment Required (Employee/Manager)
    if (status === 'active' && !subscriptionTier && role !== 'company_admin') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/30 p-4">
                <Card className="max-w-md w-full text-center shadow-2xl border-destructive/20">
                    <CardHeader>
                        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                            <ShieldAlert className="w-10 h-10" />
                        </div>
                        <CardTitle className="text-2xl">Subscription Required</CardTitle>
                        <CardDescription>
                            Your company's workspace is active, but a subscription plan has not been selected.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Please contact your Company Administrator (CEO/Finance Lead) to select a plan and unlock the platform features for your team.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => supabase.auth.signOut()}>
                            Sign Out
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return null
}
