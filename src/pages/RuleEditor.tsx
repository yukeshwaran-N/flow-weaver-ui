import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { StepRule, WorkflowStep } from "@/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Sortable Rule Row ───────────────────────────────────────────────────────
function SortableRuleRow({
  rule,
  index,
  steps,
  stepId,
  onUpdate,
  onRemove,
}: {
  rule: Partial<StepRule>;
  index: number;
  steps: WorkflowStep[];
  stepId?: string;
  onUpdate: (id: string, updates: Partial<StepRule>) => void;
  onRemove: (id: string) => void;
}) {
  const isDefault = rule.condition === "DEFAULT";
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id!, disabled: isDefault });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
    >
      <td className="px-4 py-4">
        {!isDefault && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {isDefault ? "END" : index + 1}
        </span>
      </td>
      <td className="px-6 py-4">
        {isDefault ? (
          <span className="rounded bg-muted px-2 py-1 text-sm text-muted-foreground font-medium">
            DEFAULT
          </span>
        ) : (
          <input
            value={rule.condition}
            onChange={(e) => onUpdate(rule.id!, { condition: e.target.value })}
            className="w-full rounded border border-input bg-background px-3 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="e.g. amount > 100 && country == 'US'"
          />
        )}
      </td>
      <td className="px-6 py-4 text-sm text-foreground">
        <select
          value={rule.next_step_id || ""}
          onChange={(e) =>
            onUpdate(rule.id!, { next_step_id: e.target.value || null })
          }
          className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">-- End Workflow --</option>
          {steps
            .filter((s) => s.id !== stepId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Step {s.step_order})
              </option>
            ))}
        </select>
      </td>
      <td className="px-6 py-4">
        {!isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(rule.id!)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </td>
    </tr>
  );
}

// ─── Main Rule Editor ────────────────────────────────────────────────────────
export default function RuleEditor() {
  const { workflowId, stepId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rules, setRules] = useState<Partial<StepRule>[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (workflowId && stepId) loadData();
  }, [workflowId, stepId]);

  async function loadData() {
    try {
      setLoading(true);
      const { data: stepsRaw, error: stepsError } = await supabase
        .from("workflow_steps")
        .select("id, name, step_type, step_order, metadata")
        .eq("workflow_id", workflowId || "")
        .order("step_order", { ascending: true });

      if (stepsError) throw stepsError;
      const stepsData = stepsRaw as WorkflowStep[];
      setSteps(stepsData || []);
      setCurrentStep(stepsData?.find((s) => s.id === stepId) || null);

      const { data: rulesRaw, error: rulesError } = await supabase
        .from("step_rules")
        .select("id, step_id, condition, next_step_id, priority")
        .eq("step_id", stepId || "")
        .order("priority", { ascending: true });

      if (rulesError) throw rulesError;
      const rulesData = rulesRaw as StepRule[];

      if (!rulesData || rulesData.length === 0) {
        setRules([{ id: crypto.randomUUID(), step_id: stepId, condition: "DEFAULT", next_step_id: null, priority: 999 }]);
      } else {
        setRules(rulesData);
      }
    } catch (error: any) {
      toast({ title: "Error loading rules", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function addRule() {
    const newRules = [...rules];
    const defaultIdx = newRules.findIndex((r) => r.condition === "DEFAULT");
    const newRule: Partial<StepRule> = {
      id: crypto.randomUUID(),
      step_id: stepId,
      condition: "amount > 1000",
      next_step_id: null,
      priority: 1,
    };
    if (defaultIdx !== -1) newRules.splice(defaultIdx, 0, newRule);
    else newRules.push(newRule);
    reorderPriorities(newRules);
  }

  function updateRule(id: string, updates: Partial<StepRule>) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }

  function removeRule(id: string) {
    reorderPriorities(rules.filter((r) => r.id !== id));
  }

  function reorderPriorities(list: Partial<StepRule>[]) {
    const defaultRule = list.find((r) => r.condition === "DEFAULT");
    const others = list.filter((r) => r.condition !== "DEFAULT");
    const reordered = others.map((r, i) => ({ ...r, priority: i + 1 }));
    if (defaultRule) reordered.push({ ...defaultRule, priority: 999 });
    setRules(reordered);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const nonDefault = rules.filter((r) => r.condition !== "DEFAULT");
    const defaultRule = rules.find((r) => r.condition === "DEFAULT");

    const oldIdx = nonDefault.findIndex((r) => r.id === active.id);
    const newIdx = nonDefault.findIndex((r) => r.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(nonDefault, oldIdx, newIdx).map((r, i) => ({ ...r, priority: i + 1 }));
    setRules(defaultRule ? [...reordered, { ...defaultRule, priority: 999 }] : reordered);
  }

  async function saveRules() {
    try {
      setSaving(true);
      await supabase.from("step_rules").delete().eq("step_id", stepId || "");
      const rulesToInsert = rules.map((r) => ({
        id: r.id,
        step_id: stepId,
        condition: r.condition,
        next_step_id: r.next_step_id,
        priority: r.priority,
      }));
      const { error } = await supabase.from("step_rules").insert(rulesToInsert as any);
      if (error) throw error;
      toast({ title: "Rules saved successfully!" });
      navigate(`/workflows/${workflowId}`);
    } catch (error: any) {
      toast({ title: "Error saving rules", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground">Loading rules...</div>;

  const nonDefaultRules = rules.filter((r) => r.condition !== "DEFAULT");
  const defaultRule = rules.find((r) => r.condition === "DEFAULT");
  const orderedRules = defaultRule ? [...nonDefaultRules, defaultRule] : nonDefaultRules;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">Rule Editor: {currentStep?.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Drag rules to reorder priority. First matching rule determines the next step.
          </p>
        </div>
        <Button onClick={addRule} variant="outline" className="gap-1">
          <Plus className="h-4 w-4" /> Add Rule
        </Button>
        <Button onClick={saveRules} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Rules Table with DnD */}
      <div className="rounded-lg border border-border bg-card card-shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="w-10 px-4 py-3 text-xs font-medium text-muted-foreground uppercase"></th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Priority</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Condition</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Next Step</th>
              <th className="px-6 py-3 text-xs font-medium uppercase text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={nonDefaultRules.map((r) => r.id!)} strategy={verticalListSortingStrategy}>
              <tbody>
                {orderedRules.map((rule, i) => (
                  <SortableRuleRow
                    key={rule.id}
                    rule={rule}
                    index={i}
                    steps={steps}
                    stepId={stepId}
                    onUpdate={updateRule}
                    onRemove={removeRule}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      {/* Syntax Guide */}
      <div className="rounded-lg border border-border bg-accent/50 p-6 space-y-4">
        <h3 className="text-sm font-bold text-accent-foreground uppercase tracking-wider">Halleyx Rule Syntax</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Comparison</p>
            <code className="block text-xs text-primary">amount &gt; 1000</code>
            <code className="block text-xs text-primary">status == 'urgent'</code>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">String Functions</p>
            <code className="block text-xs text-primary">contains(name, 'Halleyx')</code>
            <code className="block text-xs text-primary">startsWith(code, 'TR-')</code>
            <code className="block text-xs text-primary">endsWith(email, '.gov')</code>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Logical</p>
            <code className="block text-xs text-primary">a &gt; 100 &amp;&amp; b == 'US'</code>
            <code className="block text-xs text-primary">x &lt;= 50 || dept == 'HR'</code>
            <p className="mt-1 text-[10px] text-muted-foreground italic">DEFAULT — always matches last</p>
          </div>
        </div>
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-accent-foreground">
            <strong>Tip:</strong> Drag the <GripVertical className="inline h-3 w-3" /> handle to reorder rule priority. Lower rows = lower priority.
          </p>
        </div>
      </div>
    </div>
  );
}
