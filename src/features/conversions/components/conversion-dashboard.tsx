import { lazy, Suspense, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Award,
  Download,
  MousePointerClick,
  Percent,
  RefreshCw,
  Target,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  fetchEvents,
  fetchSessions,
  fetchWorkspacePages,
  resolveRange,
  type RangeKey,
} from "@/features/analytics/api";
import { KpiCard } from "@/features/analytics/components/kpi-card";
import { downloadCsv, downloadExcel } from "@/features/analytics/export";
import { listGoals, GOAL_TYPE_LABELS } from "../api";
import {
  conversionKpis,
  ctaPerformance,
  deviceConversion,
  funnelStages,
  goalStats,
  pageConversion,
  referralConversion,
} from "../aggregate";
import { GoalsManager } from "./goals-manager";

const ConversionFunnel = lazy(() =>
  import("./conversion-funnel").then((m) => ({ default: m.ConversionFunnel })),
);

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function ConversionDashboard({ workspaceId }: { workspaceId: string }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const range = useMemo(() => resolveRange(rangeKey), [rangeKey]);

  const eventsQ = useQuery({
    queryKey: ["conversion.events", workspaceId, rangeKey],
    queryFn: () => fetchEvents(workspaceId, range),
    staleTime: 60_000,
  });
  const sessionsQ = useQuery({
    queryKey: ["conversion.sessions", workspaceId, rangeKey],
    queryFn: () => fetchSessions(workspaceId, range),
    staleTime: 60_000,
  });
  const pagesQ = useQuery({
    queryKey: ["conversion.pages", workspaceId],
    queryFn: () => fetchWorkspacePages(workspaceId),
    staleTime: 5 * 60_000,
  });
  const goalsQ = useQuery({
    queryKey: ["conversion.goals", workspaceId],
    queryFn: () => listGoals(workspaceId),
    staleTime: 60_000,
  });

  const events = eventsQ.data ?? [];
  const sessions = sessionsQ.data ?? [];
  const pages = pagesQ.data ?? [];
  const goals = goalsQ.data ?? [];

  const stats = useMemo(() => goalStats(events, sessions, goals), [events, sessions, goals]);
  const kpis = useMemo(() => conversionKpis(stats, sessions), [stats, sessions]);
  const stages = useMemo(() => funnelStages(events, sessions, goals), [events, sessions, goals]);
  const ctas = useMemo(() => ctaPerformance(events, goals), [events, goals]);
  const pageStats = useMemo(
    () => pageConversion(events, sessions, goals, pages),
    [events, sessions, goals, pages],
  );
  const deviceStats = useMemo(
    () => deviceConversion(events, sessions, goals),
    [events, sessions, goals],
  );
  const referralStats = useMemo(
    () => referralConversion(events, sessions, goals),
    [events, sessions, goals],
  );

  const loading =
    eventsQ.isLoading || sessionsQ.isLoading || goalsQ.isLoading || pagesQ.isLoading;

  const refetchAll = () => {
    void eventsQ.refetch();
    void sessionsQ.refetch();
    void goalsQ.refetch();
  };

  const exportRows = () =>
    stats.map((s) => ({
      goal: s.goal.name,
      type: GOAL_TYPE_LABELS[s.goal.goal_type],
      enabled: s.goal.enabled,
      conversions: s.conversions,
      unique_visitors: s.uniqueVisitors,
      conversion_rate_pct: s.conversionRate.toFixed(2),
      target: s.goal.target_value ?? "",
      completion_pct: s.completionPct?.toFixed(1) ?? "",
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as RangeKey)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {format(range.from, "MMM d")} – {format(range.to, "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetchAll}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadCsv(`conversions-${rangeKey}`, exportRows())}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => downloadExcel(`conversions-${rangeKey}`, exportRows())}
              >
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem disabled>PDF report (coming soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total Conversions" value={fmt(kpis.totalConversions)} icon={Target} />
          <KpiCard
            label="Conversion Rate"
            value={`${kpis.conversionRate.toFixed(1)}%`}
            icon={Percent}
            hint="Conversions ÷ visitors"
          />
          <KpiCard
            label="Top Goal"
            value={kpis.topGoal?.goal.name ?? "—"}
            icon={Award}
            hint={
              kpis.topGoal ? `${kpis.topGoal.conversions.toLocaleString()} conversions` : undefined
            }
          />
          <KpiCard
            label="Needs Attention"
            value={kpis.lowestGoal?.goal.name ?? "—"}
            icon={TrendingDown}
            hint={
              kpis.lowestGoal
                ? `${kpis.lowestGoal.conversions.toLocaleString()} conversions`
                : undefined
            }
          />
        </div>
      )}

      {/* Goals manager */}
      <GoalsManager workspaceId={workspaceId} pages={pages} />

      {/* Goal completion */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Goal completion</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Create a goal above to start measuring completion.
            </p>
          ) : (
            <ul className="space-y-3">
              {stats.map((s) => (
                <li key={s.goal.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate font-medium">{s.goal.name}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {s.conversions.toLocaleString()}
                      {s.goal.target_value ? ` / ${s.goal.target_value}` : ""}
                    </span>
                  </div>
                  <Progress value={s.completionPct ?? Math.min(100, s.conversionRate)} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Funnel */}
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <ConversionFunnel stages={stages} />
      </Suspense>

      {/* CTA performance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">CTA performance</CardTitle>
        </CardHeader>
        <CardContent>
          {ctas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No CTAs clicked in this range.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">CTA</th>
                    <th className="py-2 pr-3 text-right">Views</th>
                    <th className="py-2 pr-3 text-right">Clicks</th>
                    <th className="py-2 pr-3 text-right">CTR</th>
                    <th className="py-2 text-right">Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {ctas.slice(0, 20).map((c) => (
                    <tr key={c.key} className="border-b last:border-0">
                      <td className="py-2 pr-3 text-xs tabular-nums text-muted-foreground">
                        {c.rank}
                      </td>
                      <td className="min-w-[220px] py-2 pr-3">
                        <p className="truncate font-medium">{c.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.url}</p>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.views.toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">
                        {c.clicks.toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.ctr.toFixed(1)}%</td>
                      <td className="py-2 text-right">
                        {c.conversionPct > 0 ? (
                          <Badge variant="secondary" className="gap-1">
                            <MousePointerClick className="h-3 w-3" /> Goal
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Page comparison + Device */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Page conversion</CardTitle>
          </CardHeader>
          <CardContent>
            {pageStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No pages yet.</p>
            ) : (
              <ul className="space-y-3">
                {pageStats.map((p) => (
                  <li key={p.pageId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {p.conversionPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{p.views.toLocaleString()} views</span>
                      <span>·</span>
                      <span>{p.conversions.toLocaleString()} conv</span>
                      <span>·</span>
                      <span>Engagement {p.engagementPct.toFixed(0)}</span>
                    </div>
                    <Progress value={Math.min(100, p.conversionPct)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Device conversion</CardTitle>
          </CardHeader>
          <CardContent>
            {deviceStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              <ul className="space-y-3">
                {deviceStats.map((d) => (
                  <li key={d.device} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium capitalize">{d.device}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {d.conversionPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.visitors.toLocaleString()} visitors · {d.conversions.toLocaleString()} conv
                    </div>
                    <Progress value={Math.min(100, d.conversionPct)} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referral */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Conversion by referral source</CardTitle>
        </CardHeader>
        <CardContent>
          {referralStats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No referral data in this range.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {referralStats.map((r) => (
                <li
                  key={r.source}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize">{r.source}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.visitors.toLocaleString()} visitors · {r.conversions.toLocaleString()} conv
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {r.conversionPct.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
