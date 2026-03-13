import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  GitBranch,
  Zap,
  Play,
  Clock,
  Plus,
  ArrowRight,
  Eye,
} from "lucide-react";

const recentExecutions = [
  { id: "EXE-001", workflow: "Order Processing", status: "completed" as const, startedBy: "John Doe", startTime: "2026-03-13 09:15" },
  { id: "EXE-002", workflow: "User Onboarding", status: "running" as const, startedBy: "Jane Smith", startTime: "2026-03-13 09:30" },
  { id: "EXE-003", workflow: "Invoice Approval", status: "pending" as const, startedBy: "Bob Wilson", startTime: "2026-03-13 09:45" },
  { id: "EXE-004", workflow: "Data Sync Pipeline", status: "failed" as const, startedBy: "Alice Brown", startTime: "2026-03-13 08:00" },
  { id: "EXE-005", workflow: "Report Generation", status: "completed" as const, startedBy: "John Doe", startTime: "2026-03-13 07:30" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your workflow automation platform</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Workflows" value={12} icon={<GitBranch className="h-5 w-5" />} trend="+2 this week" />
        <StatCard title="Active Workflows" value={8} icon={<Zap className="h-5 w-5" />} trend="67% active" />
        <StatCard title="Running Executions" value={3} icon={<Play className="h-5 w-5" />} trend="2 queued" />
        <StatCard title="Pending Approvals" value={5} icon={<Clock className="h-5 w-5" />} trend="3 urgent" />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/workflows/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Create Workflow
        </Button>
        <Button variant="outline" onClick={() => navigate("/executions")} className="gap-2">
          <Eye className="h-4 w-4" /> View Executions
        </Button>
      </div>

      {/* Recent Executions */}
      <div className="rounded-lg border border-border bg-card card-shadow">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-card-foreground">Recent Executions</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/executions")} className="gap-1 text-muted-foreground">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Execution ID</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Workflow</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Started By</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Start Time</th>
                <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentExecutions.map((exec) => (
                <tr key={exec.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-foreground">{exec.id}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{exec.workflow}</td>
                  <td className="px-6 py-4">
                    <StatusBadge variant={exec.status}>{exec.status}</StatusBadge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{exec.startedBy}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{exec.startTime}</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
