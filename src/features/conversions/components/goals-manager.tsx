import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageMeta } from "@/features/analytics/api";
import {
  GOAL_TYPE_LABELS,
  deleteGoal,
  listGoals,
  toggleGoal,
  type Goal,
} from "../api";
import { GoalDialog } from "./goal-dialog";

interface Props {
  workspaceId: string;
  pages: PageMeta[];
}

export function GoalsManager({ workspaceId, pages }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  const goalsQ = useQuery({
    queryKey: ["conversion.goals", workspaceId],
    queryFn: () => listGoals(workspaceId),
    staleTime: 60_000,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => toggleGoal(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversion.goals", workspaceId] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteGoal(id),
    onSuccess: () => {
      toast.success("Goal deleted");
      qc.invalidateQueries({ queryKey: ["conversion.goals", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const goals = goalsQ.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold">Conversion goals</CardTitle>
          <p className="text-xs text-muted-foreground">
            Define trackable outcomes for each bio page or workspace-wide.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> New goal
        </Button>
      </CardHeader>
      <CardContent>
        {goalsQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Target className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No goals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create your first conversion goal to start measuring results.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {goals.map((g) => {
              const page = pages.find((p) => p.id === g.bio_page_id);
              return (
                <li key={g.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{g.name}</p>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {GOAL_TYPE_LABELS[g.goal_type]}
                      </Badge>
                      {!g.enabled && (
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          Off
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {page ? page.name : "All pages"}
                      {g.target_value ? ` · Target ${g.target_value}` : ""}
                    </p>
                  </div>
                  <Switch
                    checked={g.enabled}
                    onCheckedChange={(v) => toggleMut.mutate({ id: g.id, enabled: v })}
                    aria-label={`Toggle ${g.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit"
                    onClick={() => {
                      setEditing(g);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete"
                    onClick={() => {
                      if (confirm(`Delete goal "${g.name}"?`)) delMut.mutate(g.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <GoalDialog
        open={open}
        onOpenChange={setOpen}
        workspaceId={workspaceId}
        pages={pages}
        goal={editing}
      />
    </Card>
  );
}
