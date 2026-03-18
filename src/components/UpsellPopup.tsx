import { useState, useEffect } from 'react'
import { useRoleContext } from '@/providers/RoleProvider'
import { useAuthContext } from '@/providers/AuthProvider'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles, Rocket, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export function UpsellPopup() {
    const { isPremium, loading: roleLoading } = useRoleContext()
    const { user } = useAuthContext()
    const [isOpen, setIsOpen] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        // Only show for logged in users who are NOT premium
        if (!roleLoading && user && !isPremium) {
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 5000) // Show after 5 seconds of activity

            return () => clearTimeout(timer)
        }
    }, [isPremium, roleLoading, user])

    const handleUpgrade = () => {
        setIsOpen(false)
        navigate('/admin/pricing')
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none bg-transparent shadow-2xl">
                <div className="relative overflow-hidden bg-card rounded-2xl border border-primary/20">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

                    <div className="relative p-8">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                                <Rocket className="w-8 h-8" />
                            </div>
                        </div>

                        <DialogHeader className="text-center space-y-2">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <DialogTitle className="text-3xl font-[900] font-outfit tracking-tight">
                                    Unlock Your Full <span className="hero-gradient">Potential</span>
                                </DialogTitle>
                            </motion.div>
                            <DialogDescription className="text-base text-muted-foreground mt-2">
                                You're currently on the free plan. Upgrade to **Pro** to build more complex automations and scale your workflows.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="mt-8 space-y-4">
                            {[
                                { icon: Sparkles, text: "Advanced AI Workflow Generation" },
                                { icon: Zap, text: "Unlimited Active Workflows" },
                                { icon: CheckCircle2, text: "Priority Execution & Real-time Logs" },
                                { icon: CheckCircle2, text: "Advanced Team Collaboration" }
                            ].map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="flex items-center gap-3 text-sm font-medium"
                                >
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                        <feature.icon className="w-3 h-3" />
                                    </div>
                                    <span>{feature.text}</span>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-10 flex flex-col gap-3">
                            <Button
                                onClick={handleUpgrade}
                                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/25 rounded-xl bg-primary hover:bg-primary/90 group"
                            >
                                Try Pro for Free
                                <Rocket className="ml-2 w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsOpen(false)}
                                className="w-full h-12 text-muted-foreground font-medium rounded-xl hover:bg-secondary/50"
                            >
                                Maybe Later
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
