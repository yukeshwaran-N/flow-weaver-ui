import { useState } from "react";
import { Search } from "lucide-react";
import type { AuditLog } from "@/types";

const mockLogs: AuditLog[] = [
  { id: "1", executionId: "EXE-001", workflow: "Order Processing", user: "John Doe", action: "Workflow executed", timestamp: "2026-03-13 09:15:00" },
  { id: "2", executionId: "EXE-001", workflow: "Order Processing", user: "Jane Smith", action: "Approval granted", timestamp: "2026-03-13 09:27:00" },
  { id: "3", executionId: "EXE-002", workflow: "User Onboarding", user: "Jane Smith", action: "Workflow executed", timestamp: "2026-03-13 09:30:00" },
  { id: "4", executionId: "EXE-004", workflow: "Data Sync Pipeline", user: "Alice Brown", action: "Execution failed", timestamp: "2026-03-13 08:00:30" },
  { id: "5", executionId: "EXE-003", workflow: "Invoice Approval", user: "Bob Wilson", action: "Workflow executed", timestamp: "2026-03-13 09:45:00" },
  { id: "6", executionId: "EXE-005", workflow: "Order Processing", user: "John Doe", action: "Workflow executed", timestamp: "2026-03-13 07:30:00" },
  { id: "7", executionId: "EXE-004", workflow: "Data Sync Pipeline", user: "System", action: "Approval rejected", timestamp: "2026-03-12 10:20:00" },
];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState("all");

  const users = Array.from(new Set(mockLogs.map((l) => l.user)));
  const filtered = mockLogs.filter((l) => {
    const matchSearch = l.workflow.toLowerCase().includes(search.toLowerCase()) || l.executionId.toLowerCase().includes(search.toLowerCase());
    const matchUser = userFilter === "all" || l.user === userFilter;
    return matchSearch && matchUser;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track all system activity and changes</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
        </div>
        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20">
          <option value="all">All Users</option>
          {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <input type="date" className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Execution ID</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Workflow</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">User</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Action</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-foreground">{log.executionId}</td>
                <td className="px-6 py-4 text-sm text-foreground">{log.workflow}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{log.user}</td>
                <td className="px-6 py-4 text-sm text-foreground">{log.action}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
