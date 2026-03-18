import { ShieldCheck, Activity, Database, Globe, Server, HardDrive, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function SystemHealth() {
    const services = [
        { name: "PostgreSQL Database", status: "Operational", uptime: "99.99%", latency: "12ms", icon: Database, color: "text-blue-500" },
        { name: "Auth Service (Supabase)", status: "Operational", uptime: "100%", latency: "45ms", icon: ShieldCheck, color: "text-green-500" },
        { name: "Storage Engine (S3)", status: "Operational", uptime: "99.95%", latency: "88ms", icon: HardDrive, color: "text-orange-500" },
        { name: "Workflow Engine", status: "Operational", uptime: "99.98%", latency: "150ms", icon: Activity, color: "text-purple-500" },
        { name: "API Gateway", status: "Operational", uptime: "99.99%", latency: "5ms", icon: Globe, color: "text-indigo-500" },
        { name: "Edge Functions", status: "Operational", uptime: "100%", latency: "32ms", icon: Server, color: "text-pink-500" },
    ];

    return (
        <div className="p-8 max-w-full space-y-8 bg-slate-50/20 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Health</h1>
                    <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
                        <Activity className="w-3 h-3 text-green-500" />
                        Live Infrastructure Monitoring
                    </p>
                </div>
                <Button variant="outline" className="bg-white group">
                    <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Refresh Stats
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                    <Card key={service.name} className="border-none shadow-sm hover:shadow-md transition-all group bg-white">
                        <CardHeader className="pb-3 border-b mb-4 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-white shadow-sm border ${service.color}`}>
                                        <service.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900">{service.name}</CardTitle>
                                        <CardDescription className="text-[10px] uppercase font-bold text-green-600 flex items-center gap-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                            {service.status}
                                        </CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Uptime</span>
                                    <span className="text-lg font-black text-slate-700">{service.uptime}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Latency</span>
                                    <span className="text-lg font-black text-slate-700">{service.latency}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5 uppercase">
                                    <span>Resource Usage</span>
                                    <span>Low</span>
                                </div>
                                <Progress value={Math.random() * 30 + 10} className="h-1.5 bg-slate-100" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden">
                <CardHeader className="border-b border-white/10">
                    <CardTitle className="text-lg">Incident History</CardTitle>
                    <CardDescription className="text-slate-400">All systems performed within normal parameters in the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">No Incidents Reported</p>
                            <p className="text-xs text-slate-500">Your infrastructure is performing optimally.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
