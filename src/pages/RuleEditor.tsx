import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { Rule } from "@/types";

const initialRules: Rule[] = [
  { id: "1", priority: 1, condition: 'amount > 1000 && priority == "High"', nextStep: "Director Approval" },
  { id: "2", priority: 2, condition: 'amount > 100 && country == "US"', nextStep: "Manager Approval" },
  { id: "3", priority: 3, condition: 'department == "Finance"', nextStep: "Finance Review" },
  { id: "4", priority: 99, condition: "DEFAULT", nextStep: "Standard Processing", isDefault: true },
];

export default function RuleEditor() {
  const navigate = useNavigate();
  const [rules] = useState<Rule[]>(initialRules);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Rule Editor</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Define routing rules for step transitions</p>
        </div>
        <Button className="gap-1"><Plus className="h-4 w-4" /> Add Rule</Button>
      </div>

      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Priority</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Condition</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Next Step</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-4"><GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" /></td>
                <td className="px-6 py-4">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {rule.priority}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <code className={`rounded px-2 py-1 text-sm ${rule.isDefault ? "bg-muted text-muted-foreground font-medium" : "bg-accent text-accent-foreground"}`}>
                    {rule.condition}
                  </code>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{rule.nextStep}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></Button>
                    {!rule.isDefault && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-border bg-accent/50 p-4">
        <p className="text-sm text-accent-foreground">
          <strong>How rules work:</strong> Rules are evaluated in priority order (lowest number first). The first matching condition determines the next step. The DEFAULT rule executes if no other rules match.
        </p>
      </div>
    </div>
  );
}
