import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PageMeta } from "@/features/analytics/api";
import {
  GOAL_DEFAULT_RULES,
  GOAL_TYPE_LABELS,
  upsertGoal,
  type Goal,
  type GoalType,
  type MatchRules,
} from "../api";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  pages: PageMeta[];
  goal: Goal | null;
}

const GOAL_OPTIONS = Object.entries(GOAL_TYPE_LABELS) as [GoalType, string][];

export function GoalDialog({ open, onOpenChange, workspaceId, pages, goal }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("whatsapp_click");
  const [pageId, setPageId] = useState<string>("all");
  const [enabled, setEnabled] = useState(true);
  const [target, setTarget] = useState<string>("");
  const [rules, setRules] = useState<MatchRules>(GOAL_DEFAULT_RULES.whatsapp_click);

  useEffect(() => {
    if (!open) return;
    if (goal) {
      setName(goal.name);
      setDescription(goal.description ?? "");
      setGoalType(goal.goal_type);
      setPageId(goal.bio_page_id ?? "all");
      setEnabled(goal.enabled);
      setTarget(goal.target_value?.toString() ?? "");
      setRules(goal.match_rules ?? {});
    } else {
      setName("");
      setDescription("");
      setGoalType("whatsapp_click");
      setPageId("all");
      setEnabled(true);
      setTarget("");
      setRules(GOAL_DEFAULT_RULES.whatsapp_click);
    }
  }, [open, goal]);

  const onTypeChange = (t: GoalType) => {
    setGoalType(t);
    if (!goal) setRules(GOAL_DEFAULT_RULES[t]);
  };

  const save = useMutation({
    mutationFn: () =>
      upsertGoal({
        id: goal?.id,
        workspace_id: workspaceId,
        bio_page_id: pageId === "all" ? null : pageId,
        name: name.trim(),
        description: description.trim() || null,
        goal_type: goalType,
        match_rules: rules,
        enabled,
        target_value: target ? Math.max(0, Math.floor(Number(target))) : null,
      }),
    onSuccess: () => {
      toast.success(goal ? "Goal updated" : "Goal created");
      qc.invalidateQueries({ queryKey: ["conversion.goals", workspaceId] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSave = name.trim().length >= 2 && !save.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "New conversion goal"}</DialogTitle>
          <DialogDescription>
            Define what a successful visit looks like so we can measure it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Book a demo"
              maxLength={80}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={goalType} onValueChange={(v) => onTypeChange(v as GoalType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_OPTIONS.map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Bio page</Label>
              <Select value={pageId} onValueChange={setPageId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All pages</SelectItem>
                  {pages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>URL contains</Label>
              <Input
                value={rules.urlContains ?? ""}
                onChange={(e) => setRules({ ...rules, urlContains: e.target.value })}
                placeholder="wa.me"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Host equals</Label>
              <Input
                value={rules.host ?? ""}
                onChange={(e) => setRules({ ...rules, host: e.target.value })}
                placeholder="calendly.com"
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Monthly target (optional)</Label>
            <Input
              id="goal-target"
              type="number"
              min={0}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Description (optional)</Label>
            <Textarea
              id="goal-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={280}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">Enabled</p>
              <p className="text-xs text-muted-foreground">
                Disabled goals stop counting toward conversions.
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={!canSave}>
            {save.isPending ? "Saving…" : goal ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
