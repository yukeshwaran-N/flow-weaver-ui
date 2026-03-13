import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import type { Execution } from "@/types";

const mockExecutions: Execution[] = [
  { id: "EXE-001", workflowId: "WF-001", workflowName: "Order Processing", status: "completed", startedBy: "John Doe", startTime: "2026-03-13 09:15", duration: "12m 30s" },
  { id: "EXE-002", workflowId: "WF-002", workflowName: "User Onboarding", status: "running", startedBy: "Jane Smith", startTime: "2026-03-13 09:30" },
  { id: "EXE-003", workflowId: "WF-003", workflowName: "Invoice Approval", status: "pending", startedBy: "Bob Wilson", startTime: "2026-03-13 09:45" },
  { id: "EXE-004", workflowId: "WF-004", workflowName: "Data Sync Pipeline", status: "failed", startedBy: "Alice Brown", startTime: "2026-03-13 08:00", duration: "0.5s" },
  { id: "EXE-005", workflowId: "WF-001", workflowName: "Order Processing", status: "completed", startedBy: "John Doe", startTime: "2026-03-13 07:30", duration: "8m 12s" },
  { id: "EXE-006", workflowId: "WF-005", workflowName: "Report Generation", status: "completed", startedBy: "Jane Smith", startTime: "2026-03-12 16:00", duration: "3m 45s" },
];

export default function Executions() {
  const [search, setSearch] = useState("");
  const filtered = mockExecutions.filter((e) => e.workflowName.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Executions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Monitor workflow execution history</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Search executions..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Workflow</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Started By</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Start Time</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Duration</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((exec) => (
              <tr key={exec.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-foreground">{exec.id}</td>
                <td className="px-6 py-4 text-sm text-foreground">{exec.workflowName}</td>
                <td className="px-6 py-4"><StatusBadge variant={exec.status}>{exec.status}</StatusBadge></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{exec.startedBy}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{exec.startTime}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{exec.duration || "—"}</td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
