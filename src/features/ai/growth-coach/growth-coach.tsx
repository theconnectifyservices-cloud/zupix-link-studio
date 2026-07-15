/**
 * LS-12D — Growth Coach Dashboard.
 *
 * Loads the growth score report, renders category KPIs, per-page cards,
 * an AI recommendation generator, and a priority action tracker.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  TrendingUp,
  Search,
  Zap,
  Accessibility,
  FileText,
  Target,
  Loader2,
  CheckCircle2,
  Circle,
  X,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import {
  loadGrowthReport,
  generateRecommendations,
  trackAction,
  listTrackedActions,
  updateActionStatus,
  listScoreHistory,
  type GrowthAction,
  type ActionStatus,
} from "./api";
import type { GrowthCategoryScore, GrowthScoreReport } from "./scoring";

interface Props {
  workspaceId: string;
}

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  design: Sparkles,
  seo: Search,
  engagement: TrendingUp,
  conversion: Target,
  accessibility: Accessibility,
  content: FileText,
};

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-500";
  if (n >= 60) return "text-amber-500";
  if (n >= 40) return "text-orange-500";
  return "text-red-500";
}

function ringColor(n: number) {
  if (n >= 80) return "stroke-emerald-500";
  if (n >= 60) return "stroke-amber-500";
  if (n >= 40) return "stroke-orange-500";
  return "stroke-red-500";
}

function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={r} className="fill-none stroke-muted" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            className={`fill-none ${ringColor(value)} transition-all`}
            strokeWidth="8"
            strokeDasharray={c}
            strokeDashoffset={off}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${scoreColor(value)}`}>{value}</span>
        </div>
      </div>
      <span className="mt-2 text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function CategoryCard({
  name,
  data,
  icon: Icon,
}: {
  name: string;
  data: GrowthCategoryScore;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{name}</span>
        </div>
        <span className={`text-xl font-bold ${scoreColor(data.score)}`}>{data.score}</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${
            data.score >= 80
              ? "bg-emerald-500"
              : data.score >= 60
                ? "bg-amber-500"
                : data.score >= 40
                  ? "bg-orange-500"
                  : "bg-red-500"
          }`}
          style={{ width: `${data.score}%` }}
        />
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {data.reasons.slice(0, 3).map((r, i) => (
          <li key={i} className="line-clamp-2">
            • {r}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ImpactBadge({ level }: { level: "low" | "medium" | "high" }) {
  const map = {
    high: "bg-emerald-500/15 text-emerald-600",
    medium: "bg-amber-500/15 text-amber-600",
    low: "bg-muted text-muted-foreground",
  } as const;
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${map[level]}`}>{level}</span>;
}

function ActionCard({
  action,
  onTrack,
  tracked,
}: {
  action: GrowthAction;
  onTrack: (a: GrowthAction) => void;
  tracked: boolean;
}) {
  const Icon = CAT_ICONS[action.category] ?? Sparkles;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-muted p-2">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h4 className="font-medium">{action.title}</h4>
            <Badge variant="outline" className="text-xs capitalize">
              {action.category}
            </Badge>
          </div>
          <p className="mb-2 text-sm text-muted-foreground">{action.rationale}</p>
          <div className="mb-3 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Impact:</span>
            <ImpactBadge level={action.impact} />
            <span className="ml-2 text-muted-foreground">Effort:</span>
            <ImpactBadge level={action.effort} />
          </div>
          {action.steps.length > 0 && (
            <ol className="mb-3 ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
              {action.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          )}
          <Button
            size="sm"
            variant={tracked ? "outline" : "default"}
            disabled={tracked}
            onClick={() => onTrack(action)}
          >
            {tracked ? "Added to plan" : "Add to action plan"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function GrowthCoach({ workspaceId }: Props) {
  const qc = useQueryClient();
  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());

  const reportQuery = useQuery({
    queryKey: ["growth-report", workspaceId, rangeDays],
    queryFn: () => loadGrowthReport({ workspaceId, rangeDays }),
    staleTime: 60_000,
  });

  const actionsQuery = useQuery({
    queryKey: ["growth-actions", workspaceId],
    queryFn: () => listTrackedActions(workspaceId),
    staleTime: 30_000,
  });

  const historyQuery = useQuery({
    queryKey: ["growth-history", workspaceId],
    queryFn: () => listScoreHistory(workspaceId),
    staleTime: 60_000,
  });

  const recQuery = useQuery<{
    summary: string;
    actions: GrowthAction[];
    generatedAt: string;
  } | null>({
    queryKey: ["growth-recs", workspaceId, rangeDays],
    queryFn: () => Promise.resolve(null),
    enabled: false,
    initialData: null,
  });

  const genMut = useMutation({
    mutationFn: async () => {
      if (!reportQuery.data) throw new Error("Report not loaded");
      return generateRecommendations(workspaceId, reportQuery.data.report);
    },
    onSuccess: (data) => {
      qc.setQueryData(["growth-recs", workspaceId, rangeDays], data);
      qc.invalidateQueries({ queryKey: ["growth-history", workspaceId] });
      toast.success("AI recommendations ready");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const trackMut = useMutation({
    mutationFn: (a: GrowthAction) => trackAction(workspaceId, a),
    onSuccess: (_r, a) => {
      setTrackedIds((s) => new Set(s).add(a.id));
      qc.invalidateQueries({ queryKey: ["growth-actions", workspaceId] });
      toast.success("Added to action plan");
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionStatus }) =>
      updateActionStatus(id, status),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["growth-actions", workspaceId] }),
  });

  const report: GrowthScoreReport | undefined = reportQuery.data?.report;

  const trendDelta = useMemo(() => {
    const h = historyQuery.data ?? [];
    if (h.length < 2 || !report) return 0;
    // history is desc; previous snapshot is index 1 (index 0 is the one we just created)
    const prev = h[1];
    return report.overall - prev.overall;
  }, [historyQuery.data, report]);

  if (reportQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (reportQuery.isError || !report) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Failed to load growth report. {(reportQuery.error as Error)?.message}
        </p>
        <Button className="mt-4" onClick={() => reportQuery.refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const rec = recQuery.data;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border p-1">
          {([7, 30, 90] as const).map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`rounded px-3 py-1 text-sm transition-colors ${
                rangeDays === d
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => reportQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Recompute
          </Button>
          <Button
            size="sm"
            onClick={() => genMut.mutate()}
            disabled={genMut.isPending}
          >
            {genMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Generate recommendations
          </Button>
        </div>
      </div>

      {/* Overview: overall ring + KPIs */}
      <Card className="p-6">
        <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center justify-center">
            <ScoreRing value={report.overall} label="Growth Score" />
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Views ({rangeDays}d)</p>
              <p className="text-2xl font-bold">{report.kpis.views.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Unique visitors</p>
              <p className="text-2xl font-bold">{report.kpis.uniqueVisitors.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Click-through rate</p>
              <p className="text-2xl font-bold">{report.kpis.ctr.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bounce rate</p>
              <p className="text-2xl font-bold">{report.kpis.bounceRate.toFixed(0)}%</p>
            </div>
            {historyQuery.data && historyQuery.data.length > 1 && (
              <div className="col-span-2 md:col-span-4">
                <p className="text-xs text-muted-foreground">
                  Trend vs previous snapshot:{" "}
                  <span
                    className={
                      trendDelta > 0
                        ? "text-emerald-500"
                        : trendDelta < 0
                          ? "text-red-500"
                          : "text-muted-foreground"
                    }
                  >
                    {trendDelta > 0 ? "+" : ""}
                    {trendDelta} pts
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Category scores */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Category performance</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <CategoryCard name="design" data={report.design} icon={CAT_ICONS.design} />
          <CategoryCard name="seo" data={report.seo} icon={CAT_ICONS.seo} />
          <CategoryCard name="engagement" data={report.engagement} icon={CAT_ICONS.engagement} />
          <CategoryCard name="conversion" data={report.conversion} icon={CAT_ICONS.conversion} />
          <CategoryCard
            name="accessibility"
            data={report.accessibility}
            icon={CAT_ICONS.accessibility}
          />
          <CategoryCard name="content" data={report.content} icon={CAT_ICONS.content} />
        </div>
      </div>

      {/* AI recommendations */}
      {rec && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Priority actions ({rec.actions.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Generated {new Date(rec.generatedAt).toLocaleTimeString()}
            </span>
          </div>
          {rec.summary && (
            <Card className="mb-3 border-primary/20 bg-primary/5 p-4">
              <p className="text-sm">{rec.summary}</p>
            </Card>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {rec.actions.map((a) => (
              <ActionCard
                key={a.id}
                action={a}
                onTrack={(x) => trackMut.mutate(x)}
                tracked={trackedIds.has(a.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action plan */}
      {actionsQuery.data && actionsQuery.data.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Your action plan</h3>
          <div className="space-y-2">
            {actionsQuery.data.map((rec) => (
              <Card key={rec.id} className="flex items-center gap-3 p-3">
                <button
                  onClick={() =>
                    statusMut.mutate({
                      id: rec.id,
                      status: rec.status === "completed" ? "pending" : "completed",
                    })
                  }
                  aria-label="Toggle completed"
                >
                  {rec.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1">
                  <p
                    className={`text-sm ${
                      rec.status === "completed"
                        ? "text-muted-foreground line-through"
                        : ""
                    }`}
                  >
                    {rec.title}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {rec.action.category} • impact {rec.action.impact}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {rec.status}
                </Badge>
                <button
                  onClick={() => statusMut.mutate({ id: rec.id, status: "dismissed" })}
                  aria-label="Dismiss"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Per-page breakdown */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          Per-page scores ({report.perPage.length})
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {report.perPage.map((p) => (
            <Card key={p.pageId} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.pageName}</p>
                  <p className="text-xs text-muted-foreground">/{p.slug}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {p.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Design</p>
                  <p className={`text-lg font-bold ${scoreColor(p.design)}`}>{p.design}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">A11y</p>
                  <p className={`text-lg font-bold ${scoreColor(p.accessibility)}`}>
                    {p.accessibility}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SEO</p>
                  <p className={`text-lg font-bold ${scoreColor(p.seo)}`}>{p.seo}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
