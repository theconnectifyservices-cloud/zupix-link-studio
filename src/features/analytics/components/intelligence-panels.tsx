import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, Gauge, MousePointerClick, Percent, Repeat, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type {
  BlockStat,
  DeviceBehaviour,
  EngagementMetrics,
  JourneyStep,
  PageStat,
  ReferrerStat,
  TrendCompare,
  VisitorProfile,
} from "../intelligence";
import { formatDuration } from "../intelligence";
import { TrendBadge } from "./insight-cards";

/* ----------------------------- Engagement ----------------------------- */

export function EngagementPanel({ m }: { m: EngagementMetrics }) {
  const rows: { icon: React.ElementType; label: string; value: string; hint?: string }[] = [
    { icon: Clock, label: "Avg time on page", value: formatDuration(m.avgTimeOnPageMs) },
    { icon: Gauge, label: "Avg scroll depth", value: `${m.avgScrollDepth.toFixed(0)}%` },
    { icon: MousePointerClick, label: "Interaction rate", value: `${m.interactionRate.toFixed(1)}%`, hint: "sessions with a click" },
    { icon: Percent, label: "Bounce rate", value: `${m.bounceRate.toFixed(1)}%` },
    { icon: Repeat, label: "Return visitor rate", value: `${m.returnVisitorRate.toFixed(1)}%` },
    { icon: Users, label: "Engagement score", value: `${m.engagementScore.toFixed(0)}/100`, hint: "scroll + clicks + dwell" },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Engagement metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <li key={r.label} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {r.label}
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{r.value}</p>
                {r.hint ? <p className="text-[11px] text-muted-foreground">{r.hint}</p> : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/* --------------------------- Block performance ------------------------ */

export function BlockPerformanceCard({ stats }: { stats: BlockStat[] }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Block performance</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No block interactions yet.</p>
        ) : (
          <ul className="space-y-3">
            {stats.map((s) => (
              <li key={s.blockType} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{s.blockType.replace("_", " ")}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.clicks.toLocaleString()} · {s.ctr.toFixed(1)}% CTR
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (s.clicks / (stats[0]?.clicks || 1)) * 100)}
                  className="h-1.5"
                />
                <p className="text-[11px] text-muted-foreground">
                  {s.uniqueVisitors.toLocaleString()} unique visitors
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------- Page performance ------------------------- */

export function PagePerformanceCard({ stats }: { stats: PageStat[] }) {
  const top = stats.slice(0, 5);
  const bottom = stats.length > 5 ? stats.slice(-3).reverse() : [];
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Page performance</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No page data in this range.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                Top performing
              </p>
              <ul className="space-y-2 text-sm">
                {top.map((p) => (
                  <li key={p.pageId} className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium">{p.name}</span>
                    <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                      {p.views.toLocaleString()} views · {p.ctr.toFixed(1)}% CTR
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {bottom.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  Needs attention
                </p>
                <ul className="space-y-2 text-sm">
                  {bottom.map((p) => (
                    <li key={p.pageId} className="flex items-center justify-between gap-3">
                      <span className="truncate">{p.name}</span>
                      <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                        {p.views.toLocaleString()} views
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------- Device comparison ------------------------- */

export function DeviceComparisonCard({ rows }: { rows: DeviceBehaviour[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Device behaviour</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No sessions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Device</th>
                  <th className="pb-2 font-medium tabular-nums">Sessions</th>
                  <th className="pb-2 font-medium tabular-nums">Avg time</th>
                  <th className="pb-2 font-medium tabular-nums">Avg clicks</th>
                  <th className="pb-2 font-medium tabular-nums">Scroll</th>
                  <th className="pb-2 font-medium tabular-nums">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.device} className="border-t border-border/60">
                    <td className="py-2 font-medium capitalize">{r.device}</td>
                    <td className="py-2 tabular-nums">{r.sessions.toLocaleString()}</td>
                    <td className="py-2 tabular-nums">{formatDuration(r.avgTimeMs)}</td>
                    <td className="py-2 tabular-nums">{r.avgClicks.toFixed(1)}</td>
                    <td className="py-2 tabular-nums">{r.avgScroll.toFixed(0)}%</td>
                    <td className="py-2 tabular-nums">{r.avgEngagement.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ----------------------------- Referrers ----------------------------- */

export function ReferrerInsightsCard({ rows }: { rows: ReferrerStat[] }) {
  if (rows.length === 0) return null;
  const best = [...rows].sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  const bestCtr = [...rows].sort((a, b) => b.ctr - a.ctr)[0];
  const worst = [...rows].sort((a, b) => a.avgEngagement - b.avgEngagement)[0];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Referral insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-3">
          <Tile label="Highest engagement" value={best.source} sub={`${best.avgEngagement.toFixed(0)}/100`} tone="pos" />
          <Tile label="Highest CTR" value={bestCtr.source} sub={`${bestCtr.ctr.toFixed(1)}%`} tone="neu" />
          <Tile label="Lowest engagement" value={worst.source} sub={`${worst.avgEngagement.toFixed(0)}/100`} tone="warn" />
        </div>
        <ul className="mt-2 divide-y divide-border/60 text-sm">
          {rows.slice(0, 6).map((r) => (
            <li key={r.source} className="flex items-center justify-between gap-3 py-2">
              <span className="capitalize">{r.source}</span>
              <span className="tabular-nums text-xs text-muted-foreground">
                {r.sessions.toLocaleString()} sessions · {r.ctr.toFixed(1)}% CTR · eng {r.avgEngagement.toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "pos" | "neu" | "warn" }) {
  const cls =
    tone === "pos"
      ? "border-emerald-500/30 bg-emerald-500/5"
      : tone === "warn"
        ? "border-amber-500/30 bg-amber-500/5"
        : "border-border bg-muted/30";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-base font-semibold capitalize">{value}</p>
      <p className="text-xs text-muted-foreground tabular-nums">{sub}</p>
    </div>
  );
}

/* ---------------------------- Trend compare -------------------------- */

export function TrendCompareCard({ rows, label }: { rows: TrendCompare[]; label: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((r) => (
            <li key={r.label} className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">{r.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{r.current.toLocaleString()}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="tabular-nums">was {r.previous.toLocaleString()}</span>
                <TrendBadge delta={r.deltaPct} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ------------------------ Returning visitors ------------------------- */

export function ReturningVisitorsCard({ rows }: { rows: VisitorProfile[] }) {
  const top = rows.slice(0, 8);
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Loyal visitors</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No returning visitors yet.</p>
        ) : (
          <ul className="space-y-3">
            {top.map((v) => (
              <li key={v.visitorHash} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs">{v.visitorHash.slice(0, 10)}…</p>
                  <p className="text-[11px] text-muted-foreground">
                    First {formatDistanceToNow(new Date(v.firstVisit), { addSuffix: true })} · last{" "}
                    {formatDistanceToNow(new Date(v.lastVisit), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {v.sessions} sessions
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* --------------------------- Visitor journey ------------------------- */

export function VisitorJourneyCard({ steps }: { steps: JourneyStep[] }) {
  const top = steps.slice(0, 8);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Top visitor journeys</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No journeys captured yet.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {top.map((s, i) => (
              <li
                key={`${s.entry}-${s.source}-${i}`}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 p-3"
              >
                <Badge variant="outline" className="capitalize">
                  {s.source}
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="truncate font-medium">{s.entry}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="truncate text-muted-foreground">{s.firstAction}</span>
                <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                  {s.count} visitors
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
