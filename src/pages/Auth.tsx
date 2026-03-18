import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Zap, Mail, Lock } from 'lucide-react'

export default function AuthPage() {
    const { toast } = useToast()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const mode = searchParams.get('mode') || 'login'
    const [loading, setLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName
                    }
                }
            })

            if (error) throw error

            toast({
                title: 'Registration Successful!',
                description: 'Welcome to Flow Weaver. You can now start automating your workflows.',
            })
            navigate('/dashboard')
        } catch (error) {
            toast({
                title: 'Registration failed',
                description: (error as Error).message,
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            })
            if (error) throw error
            navigate('/dashboard')
        } catch (error) {
            toast({
                title: 'Login failed',
                description: (error as Error).message,
                variant: 'destructive'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20 z-0 pointer-events-none" />
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-secondary/10 rounded-full blur-2xl" />

            <Link to="/" className="absolute top-8 left-8 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 z-20">
                <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[450px] relative z-10"
            >
                <div className="bg-card/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-primary/10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mx-auto mb-6 shadow-lg shadow-primary/20">
                            <Zap className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {mode === 'login'
                                ? 'Sign in to your individual control center.'
                                : 'Start automating your personal workflows today.'}
                        </p>
                    </div>

                    <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-5">
                        {mode === 'register' && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        name="fullName"
                                        placeholder="John Doe"
                                        required
                                        className="h-12 pl-10 rounded-xl bg-background/50 border-primary/10 transition-colors focus-visible:ring-primary/20"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="h-12 pl-10 rounded-xl bg-background/50 border-primary/10 transition-colors focus-visible:ring-primary/20"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                {mode === 'login' && (
                                    <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot?</a>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-12 pl-10 rounded-xl bg-background/50 border-primary/10 transition-colors focus-visible:ring-primary/20"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20" disabled={loading}>
                            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Get Started Free')}
                        </Button>
                    </form>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-muted-foreground">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        </span>{' '}
                        <Link
                            to={`/auth?mode=${mode === 'login' ? 'register' : 'login'}`}
                            className="text-primary font-bold hover:underline"
                        >
                            {mode === 'login' ? 'Sign Up' : 'Sign In'}
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
