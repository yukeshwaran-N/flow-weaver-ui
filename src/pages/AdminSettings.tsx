import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save, Building, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'

export default function AdminSettings() {
    const navigate = useNavigate()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setTimeout(() => {
            setLoading(false)
            toast({
                title: "Settings Saved",
                description: "Company policies and thresholds updated successfully."
            })
        }, 800)
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-4 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>

            <div>
                <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
                <p className="text-muted-foreground mt-1">Configure global expense thresholds, notification rules, and policies.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /> Approval Thresholds</CardTitle>
                        <CardDescription>
                            Define the maximum amount different managerial levels can auto-approve before escalating.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="mgr-limit">Manager Threshold Limit ($)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input id="mgr-limit" type="number" defaultValue="1000" />
                                </div>
                                <p className="text-xs text-muted-foreground">Amounts over this go to Company Admin.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="auto-limit">Auto-Approve Threshold ($)</Label>
                                <div className="flex gap-2 items-center">
                                    <Input id="auto-limit" type="number" defaultValue="25" />
                                </div>
                                <p className="text-xs text-muted-foreground">Amounts below this require no review.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary" /> Corporate Information</CardTitle>
                        <CardDescription>
                            Details used for branding and external invoices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="company-name">Legal Business Name</Label>
                            <Input id="company-name" defaultValue="Acme Corp HQ" />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="hq-city">HQ City</Label>
                                <Input id="hq-city" defaultValue="San Francisco" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax-id">Tax ID / EIN</Label>
                                <Input id="tax-id" defaultValue="XX-XXXXXXX" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Notifications & Policies</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">Require Receipts Always</Label>
                                <p className="text-sm text-muted-foreground">If disabled, receipts are only needed over the Auto-Approve threshold.</p>
                            </div>
                            <Switch id="strict-receipts" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">Slack Integration</Label>
                                <p className="text-sm text-muted-foreground">Send manager approval pings directly to Slack channels.</p>
                            </div>
                            <Switch id="slack-integration" />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">Daily Digest</Label>
                                <p className="text-sm text-muted-foreground">Send a summary of pending items to admins at 9 AM.</p>
                            </div>
                            <Switch id="daily-digest" defaultChecked />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t pt-6 flex justify-end">
                        <Button type="submit" disabled={loading} className="gap-2">
                            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
