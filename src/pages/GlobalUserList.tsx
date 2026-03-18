import { useState, useEffect } from "react";
import { Users, Search, RefreshCw, Filter, ShieldCheck, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function GlobalUserList() {
    const { toast } = useToast();
    const [profiles, setProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    async function fetchUsers() {
        setLoading(true);
        try {
            // In a real multi-tenant app, you'd join with company_users or similar
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("full_name");
            if (error) throw error;
            setProfiles(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, []);

    const filtered = profiles.filter((p) =>
        p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase())
    );

    const getInitials = (name: string) => {
        return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U";
    };

    return (
        <div className="p-8 max-w-full space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-inter">Platform Users</h1>
                    <p className="text-muted-foreground mt-1">Directory of all users registered across all tenants.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white" onClick={fetchUsers} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Sync Users
                    </Button>
                    <Button className="bg-slate-900 border-none">
                        <Filter className="w-4 h-4 mr-2" /> Advanced Filter
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">User Directory</CardTitle>
                                <CardDescription>Managing {profiles.length} platform-wide accounts.</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-10 h-10 border-slate-200"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-slate-50/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Security Status</th>
                                        <th className="px-6 py-4 font-semibold">Tier Context</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-10 w-40 bg-slate-100 rounded" /></td>
                                                <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded" /></td>
                                                <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-100 rounded" /></td>
                                                <td className="px-6 py-4 text-right"><div className="h-8 w-8 bg-slate-100 rounded ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : filtered.length > 0 ? (
                                        filtered.map((profile) => (
                                            <tr key={profile.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-slate-200">
                                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs">
                                                                {getInitials(profile.full_name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{profile.full_name || "New User"}</span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Mail className="w-3 h-3" /> {profile.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {profile.must_change_password ? (
                                                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-100 font-bold text-[10px] uppercase px-2 py-0">
                                                            Setup Pending
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-100 font-bold text-[10px] uppercase px-2 py-0">
                                                            <ShieldCheck className="w-2.5 h-2.5 mr-1" /> Active
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-tighter">Enterprise</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                        <Users className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic bg-slate-50/20">
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
