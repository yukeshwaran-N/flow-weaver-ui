import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Check, X, Eye } from "lucide-react";
import type { Approval } from "@/types";

const mockApprovals: Approval[] = [
  { id: "APR-001", workflowName: "Order Processing", stepName: "Manager Approval", requestedBy: "John Doe", date: "2026-03-13 09:20", status: "pending" },
  { id: "APR-002", workflowName: "Invoice Approval", stepName: "Finance Review", requestedBy: "Jane Smith", date: "2026-03-13 08:45", status: "pending" },
  { id: "APR-003", workflowName: "User Onboarding", stepName: "HR Approval", requestedBy: "Bob Wilson", date: "2026-03-12 16:30", status: "pending" },
  { id: "APR-004", workflowName: "Order Processing", stepName: "Director Approval", requestedBy: "Alice Brown", date: "2026-03-12 14:00", status: "approved" },
  { id: "APR-005", workflowName: "Data Sync Pipeline", stepName: "Admin Approval", requestedBy: "John Doe", date: "2026-03-12 10:15", status: "rejected" },
];

export default function Approvals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and manage pending workflow approvals</p>
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Approval ID</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Workflow</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Step</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Requested By</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Date</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Status</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockApprovals.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-foreground">{a.id}</td>
                <td className="px-6 py-4 text-sm text-foreground">{a.workflowName}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{a.stepName}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{a.requestedBy}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{a.date}</td>
                <td className="px-6 py-4"><StatusBadge variant={a.status}>{a.status}</StatusBadge></td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {a.status === "pending" ? (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-success hover:text-success hover:bg-success/10"><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
                      </>
                    ) : null}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Eye className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
