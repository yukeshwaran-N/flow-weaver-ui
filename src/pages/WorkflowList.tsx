import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Play, Trash2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Workflow } from "@/types";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { useToast } from "@/hooks/use-toast";

export default function WorkflowList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { company } = useCompany();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (company) {
      fetchWorkflows();
    }
  }, [company]);

  async function fetchWorkflows() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name, is_active, version, created_at, input_schema')
        .eq('company_id', company?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching workflows",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWorkflows(workflows.filter(w => w.id !== id));
      toast({ title: "Workflow deleted" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  const filtered = workflows.filter((w) => {
    const matchesSearch = w.name?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || (filter === 'active' ? w.is_active : !w.is_active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your workflow definitions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/workflows/new?ai=true")} variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/5 shadow-sm">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
          <Button onClick={() => navigate("/workflows/new")} className="gap-2 shadow-md">
            <Plus className="h-4 w-4" /> Create Workflow
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Draft / Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">Loading workflows...</div>
      ) : (
        <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">ID</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Fields</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Version</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Created</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((wf) => (
                <tr key={wf.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{wf.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{wf.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{wf.input_schema?.length || 0} fields</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">v{wf.version}</td>
                  <td className="px-6 py-4"><StatusBadge variant={wf.is_active ? 'active' : 'draft'}>{wf.is_active ? 'Active' : 'Draft'}</StatusBadge></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(wf.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/workflows/${wf.id}`)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/executions/run/${wf.id}`)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(wf.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">No workflows found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {filtered.length} of {workflows.length} workflows</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-1"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          <Button variant="outline" size="sm" className="gap-1" disabled>Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
