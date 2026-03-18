import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { useNavigate } from "react-router-dom";

export default function Approvals() {
  const { toast } = useToast();
  const { company } = useCompany();
  const navigate = useNavigate();

  const [executions, setExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    loadActionItems();
  }, [company]);

  async function loadActionItems() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select(`
          id, status, created_at, triggered_by, current_step_id, data,
          workflows!inner(name),
          profiles!triggered_by(full_name, email)
        `)
        .eq('status', 'running')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExecutions(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load action items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Action Items</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {executions.length} workflows currently running and waiting for manual steps.
        </p>
      </div>

      {executions.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center shadow-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Check className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No pending action items</h3>
          <p className="text-sm text-muted-foreground">
            You're all caught up! Workflows requiring manual approval or form input will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Execution ID</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Workflow</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Started By</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Current Step</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Date Started</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{e.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{e.workflows?.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{e.profiles?.full_name || 'System Auto'}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <StatusBadge variant="running">Waiting for input</StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/executions/detail/${e.id}`)}
                      className="text-primary hover:text-primary"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}