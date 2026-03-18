import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCompany } from "@/hooks/useCompany";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";



export default function AuditLogs() {
  const { company } = useCompany();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      fetchLogs();
    }
  }, [company]);

  async function fetchLogs() {
    setLoading(true);
    // Fetch from workflow_executions to simulate audit log items
    const { data: execs } = await supabase
      .from('workflow_executions')
      .select(`
        id,
        status,
        started_at,
        workflows ( name, company_id ),
        profiles:triggered_by ( email )
      `)
      .order('started_at', { ascending: false })
      .limit(50);

    if (execs) {
      const mapped = (execs as any[]).map(ex => ({
        id: ex.id,
        workflow_name: (ex.workflows as any)?.name || 'Unknown',
        version: ex.workflow_version,
        status: ex.status,
        actor: (ex.profiles as any)?.email || 'System',
        started_at: new Date(ex.started_at).toLocaleString(),
        ended_at: ex.ended_at ? new Date(ex.ended_at).toLocaleString() : '—'
      }));
      setLogs(mapped);
    }
    setLoading(false);
  }



  const filtered = logs.filter((l: any) => {
    const matchSearch = l.workflow_name.toLowerCase().includes(search.toLowerCase()) || l.actor.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="p-8 max-w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Global Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Cross-tenant tracking of system events, configuration changes, and security alerts.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events or actors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchLogs}>Refresh</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
              <tr className="border-b">
                <th className="px-6 py-4">Execution ID</th>
                <th className="px-6 py-4">Workflow</th>
                <th className="px-6 py-4">Version</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Started By</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">End Time</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading audit logs...</td></tr>}
              {!loading && filtered.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs">{log.id}</td>
                  <td className="px-6 py-4 font-medium">{log.workflow_name}</td>
                  <td className="px-6 py-4 text-center">{log.version}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${log.status === 'completed' ? 'bg-success/10 text-success border-success/20' :
                      log.status === 'failed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        'bg-info/10 text-info border-info/20'
                      }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.actor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{log.started_at}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">{log.ended_at}</td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/executions/detail/${log.id}`)}
                      className="text-primary hover:text-primary hover:bg-primary/5"
                    >
                      View Logs
                    </Button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No audit logs matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
