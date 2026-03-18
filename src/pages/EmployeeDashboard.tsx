import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Plus,
    CheckCircle2,
    WorkflowIcon,
    PlayCircle,
    History,
    Zap,
    ArrowUpRight,
    Crown,
    Settings,
    MoreVertical,
    Activity,
    Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useUserRole } from '@/hooks/useUserRole'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { getCachedData, cacheData, invalidateCache } from '@/lib/redis'
import { Skeleton } from '@/components/ui/skeleton'

type ExecutionMetrics = {
    totalCount: number;
    runningCount: number;
    completedCount: number;
    failedCount: number;
}

type RecentExecution = {
    id: string;
    status: string;
    started_at: string;
    workflow: {
        name: string;
    }
}

export default function EmployeeDashboard() {
    const navigate = useNavigate()
    const { user, profileLoading } = useAuth()
    const { isPremium, loading: roleLoading } = useUserRole()
    const [metrics, setMetrics] = useState<ExecutionMetrics>({
        totalCount: 0, runningCount: 0, completedCount: 0, failedCount: 0
    })
    const [recentExecutions, setRecentExecutions] = useState<RecentExecution[]>([])
    const [cacheStatus, setCacheStatus] = useState<'hit' | 'miss' | 'disabled' | 'error'>('disabled')

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user?.id) return

            const CACHE_KEY = `dashboard_metrics_${user.id}`.trim();
            console.log(`[Dashboard] Initializing fetch with key: "${CACHE_KEY}"`);

            // Check if Redis is even configured
            const isRedisConfigured = !!import.meta.env.VITE_UPSTASH_REDIS_REST_URL;

            try {
                // 1. Try fetching from Redis Cache first
                if (isRedisConfigured) {
                    console.log(`[Dashboard] Requesting Redis...`);
                    const cachedResult = await getCachedData<any>(CACHE_KEY);

                    if (cachedResult === "ERROR") {
                        console.error(`[Dashboard] Redis communication error.`);
                        setCacheStatus('error');
                    } else if (cachedResult) {
                        console.log(`[Dashboard] ⚡ Redis Hit! data:`, cachedResult);
                        setMetrics(cachedResult.metrics);
                        setRecentExecutions(cachedResult.recent);
                        setCacheStatus('hit');
                        return;
                    } else {
                        console.log(`[Dashboard] Redis Miss (Not found in cache).`);
                        setCacheStatus('miss');
                    }
                } else {
                    console.log(`[Dashboard] Redis disabled (Missing environment variables).`);
                    setCacheStatus('disabled');
                }

                // 2. Fallback to Supabase
                console.log(`[Dashboard] Syncing from Supabase...`);
                const { data: executionsData, error: dbError } = await supabase
                    .from('workflow_executions')
                    .select('*')
                    .eq('triggered_by', user.id)
                    .order('started_at', { ascending: false });

                if (dbError) {
                    console.error("[Dashboard] Supabase Query Failed Detail:", JSON.stringify(dbError, null, 2));
                    return;
                }

                if (executionsData) {
                    let running = 0, completed = 0, failed = 0, total = executionsData.length;

                    (executionsData as any[]).forEach(exec => {
                        if (exec.status === 'running' || exec.status === 'pending' || exec.status === 'in_progress') running++;
                        else if (exec.status === 'completed') completed++;
                        else if (exec.status === 'failed') failed++;
                    })

                    const newMetrics = {
                        totalCount: total,
                        runningCount: running,
                        completedCount: completed,
                        failedCount: failed
                    };

                    setMetrics(newMetrics)

                    // Map the explicit join result back to the format the UI expects (workflow.name)
                    // Map the results (safe handle for missing joins during diagnostics)
                    const recent = (executionsData.slice(0, 5) as any[]).map(e => ({
                        ...e,
                        workflow: e.workflows || { name: 'Resolving...' }
                    }));

                    setRecentExecutions(recent)

                    // 3. Save to Redis Cache (5 min TTL)
                    if (isRedisConfigured) {
                        console.log(`[Dashboard] Saving Supabase results to Redis...`);
                        await cacheData(CACHE_KEY, { metrics: newMetrics, recent }, 300);
                    }
                }
            } catch (err) {
                console.error("Dashboard Load Error:", err)
            }
        }

        fetchDashboardData()
    }, [user?.id])

    const handleInitializeFlow = async () => {
        if (user) {
            await invalidateCache(`dashboard_metrics_${user.id}`);
        }
        navigate('/executions/new');
    };

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return "Good Morning"
        if (hour < 17) return "Good Afternoon"
        return "Good Evening"
    }

    return (
        <div className="p-4 lg:p-8 max-w-full space-y-10">
            {/* Header / Hero Section */}
            <div className="relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-sidebar to-sidebar-accent/50 p-8 lg:p-12 border border-white/5 shadow-2xl">
                {isPremium && (
                    <div className="absolute -top-10 -right-10 w-60 h-60 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-all duration-700" />
                )}

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-x-4 gap-y-3 flex-wrap mb-4">
                            <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter drop-shadow-2xl leading-none whitespace-nowrap">
                                {getGreeting()},
                            </h2>
                            {profileLoading ? (
                                <Skeleton className="h-14 w-60 bg-white/10 rounded-2xl" />
                            ) : (
                                <span className="text-4xl lg:text-7xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent tracking-tighter leading-none">
                                    {user?.full_name?.split(' ')[0] || 'User'}
                                </span>
                            )}
                            {isPremium && (
                                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 border-none text-white py-2 px-4 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-shimmer bg-[length:200%_100%] font-black italic text-[10px] tracking-widest translate-y-[-0.2em]">
                                    PRO EDITION
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {cacheStatus === 'hit' && <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/20 text-[10px] uppercase font-bold tracking-tighter">⚡ Redis Cache Hit</Badge>}
                            {cacheStatus === 'miss' && <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/20 text-[10px] uppercase font-bold tracking-tighter">☁️ Supabase Sync (Saved to Redis)</Badge>}
                            {cacheStatus === 'disabled' && <Badge variant="secondary" className="bg-white/5 text-white/40 border-white/5 text-[10px] uppercase font-bold tracking-tighter">Redis Not Configured</Badge>}
                            {cacheStatus === 'error' && <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/20 text-[10px] uppercase font-bold tracking-tighter">❌ Redis Connection Error</Badge>}
                        </div>
                        <p className="text-lg text-blue-100/70 font-medium max-w-xl leading-relaxed">
                            Your workspace is synchronized. {metrics.runningCount > 0 ? `Currently processing ${metrics.runningCount} tasks.` : 'All systems standing by.'}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button className="px-8 py-6 rounded-2xl text-lg font-bold shadow-xl shadow-primary/40 hover:scale-105 transition-all bg-primary hover:bg-primary/90" onClick={handleInitializeFlow}>
                                <Zap className="mr-2 h-5 w-5 fill-current" /> Initialize Flow
                            </Button>
                        </div>
                    </div>

                    {/* Compact Interactive Stat */}
                    <div className="hidden lg:block">
                        <div className="w-56 h-56 rounded-full border-8 border-primary/10 flex flex-col items-center justify-center relative group-hover:border-primary/20 transition-all duration-700">
                            <div className="absolute inset-0 rounded-full border-t-8 border-primary animate-spin-slow opacity-30" />
                            <span className="text-6xl font-black text-primary">{Math.round((metrics.completedCount / (metrics.totalCount || 1)) * 100)}%</span>
                            <span className="text-xs uppercase font-bold tracking-widest text-sidebar-muted mt-1">Success Rate</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Runs"
                    value={metrics.totalCount}
                    icon={<Activity className="w-5 h-5 text-blue-500" />}
                    sub="Lifetime activity"
                />
                <MetricCard
                    title="Active Now"
                    value={metrics.runningCount}
                    icon={<Zap className="w-5 h-5 text-amber-500 animate-pulse" />}
                    sub="Running processes"
                    color="text-amber-500"
                />
                <MetricCard
                    title="Finished"
                    value={metrics.completedCount}
                    icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
                    sub="Success delivery"
                    color="text-green-500"
                />
                <div
                    onClick={() => navigate('/workflows')}
                    className="group cursor-pointer rounded-[2rem] bg-sidebar-accent/20 border-2 border-dashed border-sidebar-border p-6 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                >
                    <Plus className="w-8 h-8 text-sidebar-muted group-hover:text-primary transition-colors" />
                    <span className="mt-2 text-sm font-bold text-sidebar-muted group-hover:text-primary">New Workflow</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black flex items-center gap-3 italic">
                            Recent History
                            <History className="w-5 h-5 text-primary" />
                        </h3>
                        <Button variant="ghost" className="text-xs font-bold uppercase tracking-tighter" onClick={() => navigate('/executions/my')}>
                            See All <ArrowUpRight className="ml-1 w-3 h-3" />
                        </Button>
                    </div>

                    <div className="rounded-[2.5rem] bg-card/30 backdrop-blur-xl border border-border shadow-soft overflow-hidden">
                        {recentExecutions.length > 0 ? (
                            <div className="divide-y divide-border">
                                {recentExecutions.map((exec) => (
                                    <div key={exec.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => navigate(`/executions/detail/${exec.id}`)}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl ${exec.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                                                exec.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-amber-500/10 text-amber-600 animate-pulse'
                                                }`}>
                                                <WorkflowIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{exec.workflow?.name}</h4>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    Executed {formatDistanceToNow(new Date(exec.started_at))} ago
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Badge variant="outline" className={`capitalize rounded-full px-3 py-0.5 text-[10px] font-black tracking-widest ${exec.status === 'completed' ? 'border-green-500/30 text-green-500 bg-green-50/50' :
                                                exec.status === 'failed' ? 'border-red-500/30 text-red-500 bg-red-50/50' :
                                                    'border-amber-500/30 text-amber-500 bg-amber-50/50'
                                                }`}>
                                                {exec.status}
                                            </Badge>
                                            <MoreVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-20 text-center">
                                <PlayCircle className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-bold">No recent activity detected.</p>
                                <Button variant="link" onClick={() => navigate('/executions/new')}>Start a workflow to begin</Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Tips/Promo */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black italic px-2">Pro Tips</h3>

                    <Card className="rounded-[2rem] border-none bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden relative group cursor-pointer hover:scale-[1.02] transition-all duration-500" onClick={() => navigate('/workflows/new?ai=true')}>
                        <div className="absolute top-0 right-0 p-4">
                            <Sparkles className="w-6 h-6 text-white/50 group-hover:text-white group-hover:rotate-12 transition-all" />
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                        <CardContent className="p-8 space-y-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                                <Zap className="w-6 h-6 text-white fill-current" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black italic tracking-tight">AI Architect</h4>
                                <p className="text-indigo-100/80 text-xs font-bold mt-1 leading-relaxed">
                                    Describe your process and watch the AI build a complete multi-step workflow in seconds.
                                </p>
                            </div>
                            <Button variant="secondary" className="w-full rounded-xl font-black uppercase tracking-widest text-[10px] bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg">
                                Try AI Generator
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-none bg-primary text-primary-foreground shadow-2xl shadow-primary/20 overflow-hidden relative">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <CardContent className="p-8 space-y-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Settings className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="text-xl font-bold">Automate with Rules</h4>
                            <p className="text-primary-foreground/80 text-sm leading-relaxed">
                                Use our conditional logic engine to route data automatically based on input values. Perfect for expense approvals and routing.
                            </p>
                            <Button variant="secondary" className="w-full rounded-xl font-bold" onClick={() => navigate('/workflows')}>
                                Open Builder
                            </Button>
                        </CardContent>
                    </Card>

                    {roleLoading ? (
                        <Card className="rounded-[2rem] border border-sidebar-border bg-sidebar-accent/10">
                            <CardContent className="p-8 space-y-4">
                                <Skeleton className="h-10 w-10 bg-sidebar-border rounded-xl mx-auto" />
                                <Skeleton className="h-6 w-32 bg-sidebar-border mx-auto" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-full bg-sidebar-border" />
                                    <Skeleton className="h-3 w-3/4 bg-sidebar-border" />
                                </div>
                            </CardContent>
                        </Card>
                    ) : !isPremium && (
                        <Card className="rounded-[2rem] border-2 border-amber-500/20 bg-amber-500/5 overflow-hidden">
                            <CardContent className="p-8 space-y-4 text-center">
                                <Crown className="w-10 h-10 text-amber-500 mx-auto" />
                                <h4 className="text-xl font-black text-amber-600">Upgrade to Pro</h4>
                                <ul className="text-amber-700/80 text-xs text-left space-y-2 font-bold px-2">
                                    <li className="flex items-center gap-2">✓ Unlimited Workflows</li>
                                    <li className="flex items-center gap-2">✓ Webhook API Integration</li>
                                    <li className="flex items-center gap-2">✓ Priority Technical Support</li>
                                </ul>
                                <Button className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={() => navigate('/admin/pricing')}>
                                    Go Premium Now
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon, sub, color }: { title: string, value: number, icon: any, sub: string, color?: string }) {
    return (
        <Card className="rounded-[2rem] border-none shadow-xl bg-card/50 backdrop-blur-md overflow-hidden hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-muted/50 rounded-2xl">
                        {icon}
                    </div>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
                    <div className={`text-3xl font-black mt-1 ${color || 'text-foreground'}`}>{value}</div>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">{sub}</p>
                </div>
            </CardContent>
        </Card>
    )
}
