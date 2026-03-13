import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { SchemaField, WorkflowStep } from "@/types";

const initialSchema: SchemaField[] = [
  { id: "1", name: "amount", type: "number", required: true },
  { id: "2", name: "country", type: "string", required: true },
  { id: "3", name: "department", type: "string", required: false },
  { id: "4", name: "priority", type: "select", required: true, allowedValues: ["High", "Medium", "Low"] },
];

const initialSteps: WorkflowStep[] = [
  { id: "1", name: "Validate Input", type: "task", order: 1 },
  { id: "2", name: "Manager Approval", type: "approval", order: 2 },
  { id: "3", name: "Process Payment", type: "task", order: 3 },
  { id: "4", name: "Send Confirmation", type: "notification", order: 4 },
];

const typeColors: Record<string, string> = {
  task: "bg-info/10 text-info",
  approval: "bg-warning/10 text-warning",
  notification: "bg-success/10 text-success",
};

export default function WorkflowEditor() {
  const navigate = useNavigate();
  const [name, setName] = useState("Order Processing");
  const [description, setDescription] = useState("Process incoming customer orders with approval workflow");
  const [version] = useState(3);
  const [active, setActive] = useState(true);
  const [schema] = useState<SchemaField[]>(initialSchema);
  const [steps] = useState<WorkflowStep[]>(initialSteps);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/workflows")} className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Workflow Editor</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Configure workflow definition and steps</p>
        </div>
        <Button>Save Changes</Button>
      </div>

      {/* Workflow Info */}
      <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4">
        <h2 className="text-base font-semibold text-card-foreground">Workflow Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Workflow Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Version</label>
            <input value={`v${version}`} readOnly className="h-9 w-full rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={active} onCheckedChange={setActive} />
            <span className="text-sm font-medium text-foreground">{active ? "Active" : "Inactive"}</span>
          </div>
        </div>
      </div>

      {/* Input Schema */}
      <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-card-foreground">Input Schema</h2>
          <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Field</Button>
        </div>
        <div className="space-y-2">
          {schema.map((field) => (
            <div key={field.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">{field.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm text-foreground">{field.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Required</p>
                  <p className="text-sm text-foreground">{field.required ? "Yes" : "No"}</p>
                </div>
                {field.allowedValues && (
                  <div>
                    <p className="text-xs text-muted-foreground">Values</p>
                    <p className="text-sm text-foreground">{field.allowedValues.join(", ")}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-lg border border-border bg-card p-6 card-shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-card-foreground">Steps</h2>
          <Button variant="outline" size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Step</Button>
        </div>
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{step.name}</p>
                  <p className="text-xs text-muted-foreground">Step {step.order}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[step.type]}`}>
                  {step.type}
                </span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/workflows/WF-001/rules/${step.id}`)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
