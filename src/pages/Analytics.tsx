import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRole } from "@/hooks/useUserRole";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Crown, TrendingUp, Zap, Clock, ShieldCheck } from "lucide-react";

// Mock data for analytics
const executionData = [
    { name: "Mon", count: 12, success: 11 },
    { name: "Tue", count: 18, success: 17 },
    { name: "Wed", count: 15, success: 15 },
    { name: "Thu", count: 25, success: 22 },
    { name: "Fri", count: 32, success: 30 },
    { name: "Sat", count: 10, success: 10 },
    { name: "Sun", count: 8, success: 8 },
];

export default function Analytics() {
    const { isPremium } = useUserRole();

    if (!isPremium) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 shadow-inner">
                    <Crown className="w-10 h-10" />
                </div>
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2">Premium Insights</h1>
                    <p className="text-muted-foreground">
                        Unlock advanced workflow analytics, execution tracking, and performance bottleneck reports with Flow Weaver Pro.
                    </p>
                </div>
                <button
                    onClick={() => window.location.href = '/admin/pricing'}
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                    Upgrade to PRO
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 italic">
                        Flow Statistics
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 border-none text-[10px] py-0.5">PREMIUM</Badge>
                    </h1>
                    <p className="text-muted-foreground mt-1">Deep analysis of your automated workflows.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl">
                        <ShieldCheck className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-primary">Advanced Monitoring Active</span>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Executions"
                    value="120"
                    change="+14%"
                    icon={<Zap className="w-5 h-5 text-blue-500" />}
                />
                <StatCard
                    title="Success Rate"
                    value="98.5%"
                    change="+2%"
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                />
                <StatCard
                    title="Avg. Completion Time"
                    value="1.2s"
                    change="-0.4s"
                    icon={<Clock className="w-5 h-5 text-purple-500" />}
                />
                <StatCard
                    title="Active Workflows"
                    value="42"
                    change="+3"
                    icon={<GitBranch className="w-5 h-5 text-orange-500" />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Execution Chart */}
                <Card className="rounded-[2rem] border-none shadow-xl bg-card/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Execution History</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={executionData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563ea" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563ea" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '15px', border: 'none', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(5px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#2563ea" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Success vs Count */}
                <Card className="rounded-[2rem] border-none shadow-xl bg-card/50 backdrop-blur-md">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Success Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={executionData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Line type="monotone" dataKey="success" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="count" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: any }) {
    return (
        <Card className="rounded-3xl border-none shadow-lg bg-card/30 backdrop-blur-sm group hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-background rounded-2xl shadow-sm border">
                        {icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {change}
                    </span>
                </div>
                <h3 className="text-muted-foreground text-xs font-bold uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-black mt-1">{value}</p>
            </CardContent>
        </Card>
    );
}

function GitBranch(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="6" x2="6" y1="3" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
    )
}
