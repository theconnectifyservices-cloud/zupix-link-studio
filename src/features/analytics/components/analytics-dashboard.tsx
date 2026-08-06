import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  BarChart3,
  CalendarCheck,
  Download,
  Eye,
  Globe2,
  Link2,
  MessageSquare,
  MousePointerClick,
  QrCode,
  RefreshCw,
  Repeat,
  ShoppingBag,
  Smartphone,
  Users,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchActiveVisitors,
  fetchEvents,
  fetchRecentEvents,
  fetchSessions,
  fetchWorkspacePages,
  resolveRange,
  type RangeKey,
} from "../api";
import { listLeads, listBookings } from "@/features/business/api";
import {
  bucketTimeseries,
  computeKpis,
  deviceMix,
  groupCount,
  linkPerformance,
  pickBucket,
} from "../aggregate";
import {
  blockPerformance,
  buttonPerformance,
  computeEngagement,
  deviceBehaviour,
  pagePerformance,
  referrerInsights,
  returningVisitors,
  trendCompare,
  visitorJourneys,
} from "../intelligence";
import { generateInsights } from "../insights";
import { downloadCsv, downloadExcel } from "../export";
import { KpiCard } from "./kpi-card";
import { TrendChart } from "./trend-chart";
import { DonutChart } from "./donut-chart";
import { RankedList } from "./ranked-list";
import { InsightCards } from "./insight-cards";
import {
  BlockPerformanceCard,
  DeviceComparisonCard,
  EngagementPanel,
  PagePerformanceCard,
  ReferrerInsightsCard,
  ReturningVisitorsCard,
  TrendCompareCard,
  VisitorJourneyCard,
} from "./intelligence-panels";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function AnalyticsDashboard({ workspaceId }: { workspaceId: string }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [metric, setMetric] = useState<"views" | "clicks" | "visitors">("views");

  const range = useMemo(() => resolveRange(rangeKey), [rangeKey]);

  const eventsQ = useQuery({
    queryKey: ["analytics.events", workspaceId, rangeKey],
    queryFn: () => fetchEvents(workspaceId, range),
    staleTime: 60_000,
  });
  const sessionsQ = useQuery({
    queryKey: ["analytics.sessions", workspaceId, rangeKey],
    queryFn: () => fetchSessions(workspaceId, range),
    staleTime: 60_000,
  });
  const pagesQ = useQuery({
    queryKey: ["analytics.pages", workspaceId],
    queryFn: () => fetchWorkspacePages(workspaceId),
    staleTime: 5 * 60_000,
  });
  const activeQ = useQuery({
    queryKey: ["analytics.active", workspaceId],
    queryFn: () => fetchActiveVisitors(workspaceId),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const leadsQ = useQuery({
    queryKey: ["business.leads", workspaceId],
    queryFn: () => listLeads(workspaceId),
  });
  const bookingsQ = useQuery({
    queryKey: ["business.bookings", workspaceId],
    queryFn: () => listBookings(workspaceId),
  });
  const recentQ = useQuery({
    queryKey: ["analytics.recent", workspaceId],
    queryFn: () => fetchRecentEvents(workspaceId, 15),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const events = eventsQ.data ?? [];
  const sessions = sessionsQ.data ?? [];
  const pages = pagesQ.data ?? [];
  const pageName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of pages) map.set(p.id, p.name);
    return (id: string | null | undefined) => (id && map.get(id)) || "Unknown page";
  }, [pages]);

  const kpis = useMemo(() => computeKpis(events, sessions, leadsQ.data, bookingsQ.data), [events, sessions, leadsQ.data, bookingsQ.data]);
  const bucket = useMemo(() => pickBucket(range), [range]);
  const series = useMemo(
    () => bucketTimeseries(events, sessions, range, bucket),
    [events, sessions, range, bucket],
  );
  const devices = useMemo(() => deviceMix(events), [events]);
  const browsers = useMemo(
    () => groupCount(events.filter((e) => e.event_type === "page_view"), (e) => e.browser ?? "Unknown"),
    [events],
  );
  const oses = useMemo(
    () => groupCount(events.filter((e) => e.event_type === "page_view"), (e) => e.os ?? "Unknown"),
    [events],
  );
  const countries = useMemo(() => groupCount(sessions, (s) => s.country ?? "Unknown"), [sessions]);
  const regions = useMemo(() => groupCount(sessions, (s) => s.region ?? "Unknown"), [sessions]);
  const cities = useMemo(() => groupCount(sessions, (s) => s.city ?? "Unknown"), [sessions]);
  const sourceStats = useMemo(() => {
    const views = events.filter((e) => e.event_type === "page_view");
    const total = views.length || 1;
    const map = new Map<string, number>();
    const SOCIAL_SOURCES = [
      "Instagram",
      "Facebook",
      "WhatsApp",
      "LinkedIn",
      "YouTube",
      "Telegram",
      "X",
      "Twitter",
      "Google",
    ];

    for (const v of views) {
      let src = v.referrer_source || "Direct";
      const matched = SOCIAL_SOURCES.find((s) => src.toLowerCase().includes(s.toLowerCase()));
      if (matched) src = matched;
      map.set(src, (map.get(src) ?? 0) + 1);
    }
    return Array.from(map, ([key, count]) => ({
      key,
      label: key,
      count,
      pct: (count / total) * 100,
    })).sort((a, b) => b.count - a.count);
  }, [events]);

  const bookingStats = useMemo(() => {
    const data = bookingsQ.data ?? [];
    return {
      upcoming: data.filter((b) => b.status === "pending" || b.status === "approved").length,
      completed: data.filter((b) => b.status === "completed").length,
      cancelled: data.filter((b) => b.status === "cancelled").length,
      mostBooked: groupCount(data, (b) => b.service_title)[0]?.label || "None",
    };
  }, [bookingsQ.data]);

  const leadStats = useMemo(() => {
    const data = leadsQ.data ?? [];
    return {
      total: data.length,
      latest: data.slice(0, 5),
    };
  }, [leadsQ.data]);

  const referrers = sourceStats;
  const links = useMemo(() => linkPerformance(events), [events]);
  const publishedCount = pages.filter((p) => p.status === "published").length;
  const qrByPage = useMemo(
    () =>
      groupCount(events.filter((e) => e.event_type === "qr_scan"), (e) => pageName(e.bio_page_id)),
    [events, pageName],
  );

  // Visitor intelligence memoized aggregations
  const engagement = useMemo(() => computeEngagement(sessions), [sessions]);
  const buttonStats = useMemo(() => buttonPerformance(events), [events]);
  const blockStats = useMemo(() => blockPerformance(events), [events]);
  const pageStats = useMemo(() => pagePerformance(events, sessions, pages), [events, sessions, pages]);
  const deviceStats = useMemo(() => deviceBehaviour(sessions), [sessions]);
  const referrerStats = useMemo(() => referrerInsights(events, sessions), [events, sessions]);
  const loyalVisitors = useMemo(() => returningVisitors(sessions), [sessions]);
  const journeys = useMemo(() => visitorJourneys(events, sessions, pages), [events, sessions, pages]);
  const trends = useMemo(() => trendCompare(events, sessions, range), [events, sessions, range]);
  const insights = useMemo(() => generateInsights(events, sessions), [events, sessions]);

  const loading = eventsQ.isLoading || sessionsQ.isLoading;

  const refetchAll = () => {
    void eventsQ.refetch();
    void sessionsQ.refetch();
    void activeQ.refetch();
    void recentQ.refetch();
  };

  const exportRows = () =>
    events.map((e) => ({
      created_at: e.created_at,
      event_type: e.event_type,
      page: pageName(e.bio_page_id),
      device: e.device_type,
      browser: e.browser ?? "",
      os: e.os ?? "",
      country: e.country ?? "",
      city: e.city ?? "",
      referrer: e.referrer_source ?? "direct",
      link_url: e.link_url ?? "",
    }));

  return (
    <div className="space-y-6">
      {/* Controls */}
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
              <DropdownMenuItem onClick={() => downloadCsv(`analytics-${rangeKey}`, exportRows())}>
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadExcel(`analytics-${rangeKey}`, exportRows())}>
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem disabled>PDF report (coming soon)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          <KpiCard label="Total Views" value={formatNumber(kpis.totalViews)} icon={Eye} />
          <KpiCard
            label="Unique Visitors"
            value={formatNumber(kpis.uniqueVisitors)}
            icon={Users}
          />
          <KpiCard
            label="Total Clicks"
            value={formatNumber(kpis.totalClicks)}
            icon={MousePointerClick}
          />
          <KpiCard
            label="CTR"
            value={`${kpis.ctr.toFixed(1)}%`}
            icon={BarChart3}
            hint="Clicks ÷ views"
          />
          <KpiCard label="Leads" value={kpis.leads} icon={MessageSquare} />
          <KpiCard label="Bookings" value={kpis.bookings} icon={CalendarCheck} />
          <KpiCard label="Store Orders" value={0} icon={ShoppingBag} />
          <KpiCard
            label="Conv. Rate"
            value={`${kpis.conversionRate.toFixed(1)}%`}
            icon={RefreshCw}
            hint="Leads + Bookings ÷ Views"
          />
          <KpiCard label="Payments" value={0} icon={RefreshCw} />
          <KpiCard label="Revenue" value="₹0" icon={RefreshCw} />
        </div>
      )}

      {/* Real-time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold">Real-time activity</CardTitle>
          <Badge variant="outline" className="gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {activeQ.data?.length ?? 0} active
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Live sessions (5 min)
            </p>
            {(activeQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active visitors right now.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(activeQ.data ?? []).slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      {pageName(s.bio_page_id)}{" "}
                      <span className="text-muted-foreground">· {s.country ?? "—"}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.device_type} · {s.page_views}v / {s.link_clicks}c
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent events
            </p>
            {(recentQ.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(recentQ.data ?? []).slice(0, 8).map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">
                      <Badge variant="secondary" className="mr-2 text-[10px] uppercase">
                        {e.event_type.replace("_", " ")}
                      </Badge>
                      {e.event_type === "link_click" && e.link_host
                        ? e.link_host
                        : pageName(e.bio_page_id)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(e.created_at), "HH:mm:ss")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trend chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold">Traffic over time</CardTitle>
          <Tabs value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
            <TabsList className="h-8">
              <TabsTrigger value="views" className="text-xs">
                Views
              </TabsTrigger>
              <TabsTrigger value="visitors" className="text-xs">
                Visitors
              </TabsTrigger>
              <TabsTrigger value="clicks" className="text-xs">
                Clicks
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-64 w-full" /> : <TrendChart data={series} metric={metric} />}
        </CardContent>
      </Card>

      {/* Devices + Sources */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Device mix</CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
            ) : (
              <>
                <DonutChart data={devices} />
                <ul className="mt-3 space-y-1.5 text-xs">
                  {devices.slice(0, 4).map((d) => (
                    <li key={d.key} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="h-3 w-3 text-muted-foreground" />
                        {d.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{d.pct.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
        <RankedList title="Browsers" data={browsers} />
        <RankedList title="Operating systems" data={oses} />
      </div>

      {/* Location */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RankedList title="Top countries" data={countries} />
        <RankedList title="Top regions" data={regions} />
        <RankedList title="Top cities" data={cities} />
      </div>

      {/* Traffic sources + Links */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList title="Traffic sources" data={sourceStats} />
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top performing links</CardTitle>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No link clicks in this range.
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {links.slice(0, 10).map((l) => (
                  <li key={l.url} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.host || l.url}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="truncate text-[10px] text-muted-foreground">{l.url}</p>
                        <Badge variant="secondary" className="h-4 text-[9px] px-1">{l.ctr.toFixed(1)}% CTR</Badge>
                      </div>
                    </div>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {l.clicks.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Analytics: Bookings & Leads */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Booking Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-xl font-bold">{bookingStats.upcoming}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold">{bookingStats.completed}</p>
              </div>
              <div className="col-span-2 pt-2 border-t">
                <p className="text-[10px] uppercase text-muted-foreground font-medium mb-1">Most Booked Service</p>
                <p className="text-sm font-medium truncate">{bookingStats.mostBooked}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Latest Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {leadStats.latest.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No leads yet</p>
            ) : (
              <ul className="space-y-2">
                {leadStats.latest.map(l => (
                  <li key={l.id} className="flex items-center justify-between text-xs border-b pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{l.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-muted-foreground">{l.email || l.phone || 'No contact'}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{format(new Date(l.created_at), 'MMM d')}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Least clicked (for optimization) */}
      {links.length > 3 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Least clicked links</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {[...links]
                .reverse()
                .slice(0, 5)
                .map((l) => (
                  <li key={l.url} className="flex items-center justify-between gap-3">
                    <span className="truncate">{l.host || l.url}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {l.clicks.toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* QR analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">QR scans over time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-2xl font-semibold tabular-nums">{kpis.qrScans.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total QR scans in this range</p>
          </CardContent>
        </Card>
        <RankedList title="Top QR-driven pages" data={qrByPage} emptyLabel="No QR scans yet" />
      </div>

      {/* ================== Visitor Intelligence ================== */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Visitor Intelligence
          </h2>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Auto insights */}
        {!loading && <InsightCards cards={insights} />}

        {/* Trend comparison */}
        {!loading && <TrendCompareCard rows={trends} label="Current vs previous period" />}

        {/* Engagement metrics */}
        {!loading && <EngagementPanel m={engagement} />}

        {/* Page + Block performance */}
        <div className="grid gap-4 lg:grid-cols-2">
          <PagePerformanceCard stats={pageStats} />
          <BlockPerformanceCard stats={blockStats} />
        </div>

        {/* Device behavior */}
        <DeviceComparisonCard rows={deviceStats} />

        {/* Referrer insights + Loyal visitors */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ReferrerInsightsCard rows={referrerStats} />
          <ReturningVisitorsCard rows={loyalVisitors} />
        </div>

        {/* Button ranking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Button performance ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {buttonStats.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No button clicks in this range.
              </p>
            ) : (
              <ol className="space-y-2 text-sm">
                {buttonStats.slice(0, 12).map((b) => (
                  <li
                    key={b.url}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
                        {b.rank}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.host || b.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{b.url}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums">{b.clicks.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {b.ctr.toFixed(1)}% CTR
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Visitor journeys */}
        <VisitorJourneyCard steps={journeys} />
      </div>
    </div>
  );
}
