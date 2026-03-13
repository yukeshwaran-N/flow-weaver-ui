import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Play, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Workflow } from "@/types";

const mockWorkflows: Workflow[] = [
  { id: "WF-001", name: "Order Processing", description: "Process incoming orders", steps: 5, version: 3, status: "active", createdAt: "2026-01-15" },
  { id: "WF-002", name: "User Onboarding", description: "New user setup flow", steps: 4, version: 2, status: "active", createdAt: "2026-01-20" },
  { id: "WF-003", name: "Invoice Approval", description: "Approve invoices", steps: 6, version: 1, status: "active", createdAt: "2026-02-01" },
  { id: "WF-004", name: "Data Sync Pipeline", description: "Sync data across systems", steps: 3, version: 5, status: "inactive", createdAt: "2026-02-10" },
  { id: "WF-005", name: "Report Generation", description: "Generate reports", steps: 4, version: 2, status: "draft", createdAt: "2026-02-15" },
  { id: "WF-006", name: "Support Ticket Routing", description: "Route support tickets", steps: 7, version: 1, status: "active", createdAt: "2026-03-01" },
];

export default function WorkflowList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = mockWorkflows.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || w.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Workflows</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your workflow definitions</p>
        </div>
        <Button onClick={() => navigate("/workflows/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Create Workflow
        </Button>
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
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">ID</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Name</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Steps</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Version</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Created</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((wf) => (
              <tr key={wf.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-foreground">{wf.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{wf.name}</p>
                    <p className="text-xs text-muted-foreground">{wf.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{wf.steps}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">v{wf.version}</td>
                <td className="px-6 py-4"><StatusBadge variant={wf.status}>{wf.status}</StatusBadge></td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{wf.createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/workflows/${wf.id}`)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/executions/run/${wf.id}`)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing {filtered.length} of {mockWorkflows.length} workflows</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled className="gap-1"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          <Button variant="outline" size="sm" className="gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
