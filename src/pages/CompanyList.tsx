import { useState, useEffect } from "react";
import { Building2, Plus, Search, RefreshCw, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function CompanyList() {
    const { toast } = useToast();
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    async function fetchCompanies() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("companies")
                .select("*")
                .order("name");
            if (error) throw error;
            setCompanies(data || []);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchCompanies();
    }, []);

    const filtered = companies.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.admin_email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Companies</h1>
                    <p className="text-muted-foreground mt-1">Manage all provisioned tenants and their settings.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={fetchCompanies} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Sync
                    </Button>
                    <Button className="bg-slate-900">
                        <Plus className="w-4 h-4 mr-2" /> New Company
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search companies by name or admin email..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    [...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse border-slate-200">
                            <CardHeader className="h-24 bg-slate-50" />
                            <CardContent className="h-20" />
                        </Card>
                    ))
                ) : filtered.length > 0 ? (
                    filtered.map((company) => (
                        <Card key={company.id} className="group hover:shadow-md transition-shadow border-slate-200 overflow-hidden">
                            <div className="h-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-slate-100 rounded-lg">
                                            <Building2 className="w-4 h-4 text-slate-600" />
                                        </div>
                                        <CardTitle className="text-lg">{company.name}</CardTitle>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-400">Admin Email</span>
                                        <span className="text-sm text-slate-600 truncate">{company.admin_email || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-full text-[10px] px-2 py-0">
                                            {company.subscription_tier || "Enterprise"}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            Created {new Date(company.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <Building2 className="mx-auto h-12 w-12 text-slate-200" />
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">No companies found</h3>
                        <p className="mt-2 text-slate-500">Try adjusting your search or sync to fetch the latest data.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
