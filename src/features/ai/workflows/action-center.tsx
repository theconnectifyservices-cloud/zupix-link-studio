/**
 * LS-12E — AI Action Center.
 *
 * Central hub for AI workflows: launch from the library, review pending
 * previews, approve / reject / undo, and audit history. Provider status &
 * observability panels round out the operator view.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Target,
  Search,
  Share2,
  Palette,
  Archive,
  TrendingUp,
  Check,
  X as XIcon,
  Undo2,
  RefreshCw,
  Play,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { WORKFLOWS, type WorkflowDefinition } from "./registry";
import {
  approveRun,
  createRun,
  listRuns,
  rejectRun,
  retryRun,
  undoRun,
  type WorkflowRunRow,
  type WorkflowStatus,
} from "./api";
import { PROVIDER_REGISTRY } from "./providers";
import { MemoryPanel } from "./memory-panel";

const ICONS: Record<string, typeof Sparkles> = {
  Sparkles,
  Target,
  Search,
  Share2,
  Palette,
  Archive,
  TrendingUp,
};

const STATUS_STYLES: Record<
  WorkflowStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground", icon: Clock },
  running: { label: "Running", className: "bg-blue-500/15 text-blue-600", icon: Loader2 },
  awaiting_approval: {
    label: "Needs approval",
    className: "bg-amber-500/15 text-amber-600",
    icon: AlertCircle,
  },
  approved: { label: "Approved", className: "bg-emerald-500/15 text-emerald-600", icon: Check },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-600",
    icon: CheckCircle2,
  },
  rejected: { label: "Rejected", className: "bg-muted text-muted-foreground", icon: XIcon },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive", icon: AlertCircle },
  scheduled: { label: "Scheduled", className: "bg-purple-500/15 text-purple-600", icon: Clock },
  undone: { label: "Undone", className: "bg-muted text-muted-foreground", icon: Undo2 },
};

interface Props {
  workspaceId: string;
  userId: string;
}

export function ActionCenter({ workspaceId, userId }: Props) {
  const [runs, setRuns] = useState<WorkflowRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const refresh = async () => {
    try {
      const rows = await listRuns(workspaceId, { limit: 100 });
      setRuns(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load runs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const buckets = useMemo(() => {
    return {
      pending: runs.filter((r) => r.status === "awaiting_approval"),
      running: runs.filter((r) => r.status === "running" || r.status === "pending"),
      scheduled: runs.filter((r) => r.status === "scheduled"),
      completed: runs.filter((r) => r.status === "completed" || r.status === "approved"),
      failed: runs.filter((r) => r.status === "failed"),
      history: runs,
    };
  }, [runs]);

  const runWorkflow = async (wf: WorkflowDefinition) => {
    setBusy(`launch:${wf.id}`);
    try {
      await createRun({
        workspaceId,
        userId,
        workflowId: wf.id,
        target: { kind: wf.targetKind },
        triggerType: "manual",
      });
      toast.success(`${wf.title} started`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start workflow");
    } finally {
      setBusy(null);
    }
  };

  const handleApprove = async (run: WorkflowRunRow) => {
    setBusy(`approve:${run.id}`);
    try {
      const edited = editing[run.id];
      const editedPreview =
        edited !== undefined ? { ...run.preview, output: edited } : undefined;
      await approveRun(run, { editedPreview });
      toast.success("Applied as draft");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (run: WorkflowRunRow) => {
    setBusy(`reject:${run.id}`);
    try {
      await rejectRun(run);
      toast.message("Rejected");
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  const handleUndo = async (run: WorkflowRunRow) => {
    setBusy(`undo:${run.id}`);
    try {
      await undoRun(run);
      toast.success("Reverted");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Undo failed");
    } finally {
      setBusy(null);
    }
  };

  const handleRetry = async (run: WorkflowRunRow) => {
    setBusy(`retry:${run.id}`);
    try {
      await retryRun(run);
      await refresh();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="library">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="pending">
            Pending{buckets.pending.length ? ` (${buckets.pending.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="running">Running</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="memory">AI Memory</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOWS.map((wf) => {
              const Icon = ICONS[wf.icon] ?? Sparkles;
              return (
                <Card key={wf.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {wf.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-3">{wf.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{wf.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>~{wf.estimatedSeconds}s</span>
                      {wf.requiresApproval && <Badge variant="secondary">Approval required</Badge>}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runWorkflow(wf)}
                      disabled={busy === `launch:${wf.id}`}
                    >
                      {busy === `launch:${wf.id}` ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Run workflow
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <RunList
            runs={buckets.pending}
            loading={loading}
            emptyText="No previews waiting for approval."
            renderRun={(run) => (
              <div className="space-y-3">
                <PreviewBlock run={run} value={editing[run.id]} onChange={(v) => setEditing((e) => ({ ...e, [run.id]: v }))} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleApprove(run)} disabled={busy === `approve:${run.id}`}>
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReject(run)} disabled={busy === `reject:${run.id}`}>
                    <XIcon className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="running" className="mt-6">
          <RunList runs={buckets.running} loading={loading} emptyText="Nothing running." />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <RunList runs={buckets.scheduled} loading={loading} emptyText="No scheduled runs." />
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <RunList
            runs={buckets.completed}
            loading={loading}
            emptyText="No completed runs yet."
            renderRun={(run) => (
              <div className="space-y-3">
                <PreviewBlock run={run} readOnly />
                {run.status === "completed" && (
                  <Button size="sm" variant="outline" onClick={() => handleUndo(run)} disabled={busy === `undo:${run.id}`}>
                    <Undo2 className="h-4 w-4 mr-1" /> Undo
                  </Button>
                )}
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="failed" className="mt-6">
          <RunList
            runs={buckets.failed}
            loading={loading}
            emptyText="No failures. Nice."
            renderRun={(run) => (
              <div className="space-y-3">
                {run.error && <p className="text-sm text-destructive">{run.error}</p>}
                <Button size="sm" variant="outline" onClick={() => handleRetry(run)} disabled={busy === `retry:${run.id}`}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Retry
                </Button>
              </div>
            )}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <RunList runs={buckets.history} loading={loading} emptyText="No workflow runs yet." showDetails />
        </TabsContent>

        <TabsContent value="memory" className="mt-6">
          <MemoryPanel workspaceId={workspaceId} userId={userId} />
        </TabsContent>

        <TabsContent value="providers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Provider registry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PROVIDER_REGISTRY.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between border rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.defaultModel} • {p.capabilities.join(", ")}
                      </div>
                    </div>
                    <Badge variant={p.enabled ? "default" : "outline"}>
                      {p.enabled ? "Active" : "Failover"}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Requests route to the primary provider. On failure the engine tries the next
                enabled provider in registry order. Add provider secrets to enable failover.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RunList({
  runs,
  loading,
  emptyText,
  renderRun,
  showDetails,
}: {
  runs: WorkflowRunRow[];
  loading: boolean;
  emptyText: string;
  renderRun?: (run: WorkflowRunRow) => React.ReactNode;
  showDetails?: boolean;
}) {
  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (runs.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const style = STATUS_STYLES[run.status];
        const Icon = style.icon;
        const wf = WORKFLOWS.find((w) => w.id === run.workflow_id);
        return (
          <Card key={run.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{wf?.title ?? run.workflow_id}</span>
                    <Badge className={style.className}>
                      <Icon
                        className={`h-3 w-3 mr-1 ${run.status === "running" ? "animate-spin" : ""}`}
                      />
                      {style.label}
                    </Badge>
                    <Badge variant="outline" className="capitalize text-xs">
                      {run.trigger_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(run.created_at).toLocaleString()}
                    {run.provider && ` • ${run.provider}/${run.model ?? "?"}`}
                    {typeof run.latency_ms === "number" && ` • ${run.latency_ms}ms`}
                    {run.retries > 0 && ` • retries: ${run.retries}`}
                  </div>
                </div>
              </div>
              {showDetails && run.error && (
                <p className="mt-2 text-xs text-destructive">{run.error}</p>
              )}
              {renderRun && <div className="mt-3">{renderRun(run)}</div>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PreviewBlock({
  run,
  value,
  onChange,
  readOnly,
}: {
  run: WorkflowRunRow;
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  const output =
    typeof (run.preview as { output?: unknown }).output === "string"
      ? ((run.preview as { output: string }).output)
      : JSON.stringify(run.preview, null, 2);
  if (readOnly) {
    return (
      <pre className="text-xs bg-muted/50 rounded p-3 whitespace-pre-wrap overflow-x-auto">
        {output}
      </pre>
    );
  }
  return (
    <Textarea
      className="min-h-[140px] text-sm font-mono"
      value={value ?? output}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value)}
    />
  );
}
