import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  Download,
  Megaphone,
  MousePointerClick,
  Percent,
  RefreshCw,
  TrendingDown,
  TrendingUp,
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchWorkspacePages, resolveRange, type RangeKey } from "@/features/analytics/api";
import { KpiCard } from "@/features/analytics/components/kpi-card";
import { downloadCsv, downloadExcel } from "@/features/analytics/export";
import {
  fetchAttrEvents,
  fetchAttrSessions,
  listCampaigns,
} from "../api";
import {
  campaignPerformance,
  channelBreakdown,
  marketingKpis,
  prettySource,
  sourceBreakdown,
  type TouchModel,
} from "../aggregate";
import { CampaignsManager } from "./campaigns-manager";
import { UtmBuilder } from "./utm-builder";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

function pct(n: number): string {
  return `${n.toFixed(n >= 10 ? 0 : 1)}%`;
}
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function CampaignsDashboard({ workspaceId }: { workspaceId: string }) {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [touch, setTouch] = useState<TouchModel>("last");
  const range = useMemo(() => resolveRange(rangeKey), [rangeKey]);

  const sessionsQ = useQuery({
    queryKey: ["campaigns.sessions", workspaceId, rangeKey],
    queryFn: () => fetchAttrSessions(workspaceId, range.from, range.to),
    staleTime: 60_000,
  });
  const eventsQ = useQuery({
    queryKey: ["campaigns.events", workspaceId, rangeKey],
    queryFn: () => fetchAttrEvents(workspaceId, range.from, range.to),
    staleTime: 60_000,
  });
  const campaignsQ = useQuery({
    queryKey: ["campaigns.list", workspaceId],
    queryFn: () => listCampaigns(workspaceId),
    staleTime: 60_000,
  });
  const pagesQ = useQuery({
    queryKey: ["campaigns.pages", workspaceId],
    queryFn: () => fetchWorkspacePages(workspaceId),
    staleTime: 5 * 60_000,
  });

  const sessions = sessionsQ.data ?? [];
  const events = eventsQ.data ?? [];
  const campaigns = campaignsQ.data ?? [];
  const pages = pagesQ.data ?? [];

  const sources = useMemo(
    () => sourceBreakdown(sessions, events, touch),
    [sessions, events, touch],
  );
  const knownSources = useMemo(
    () => sourceBreakdown(sessions, events, touch, true),
    [sessions, events, touch],
  );
  const channels = useMemo(() => channelBreakdown(sessions, events), [sessions, events]);
  const campaignStats = useMemo(
    () => campaignPerformance(campaigns, sessions, events),
    [campaigns, sessions, events],
  );
  const kpis = useMemo(
    () => marketingKpis(sources, campaignStats, sessions, events),
    [sources, campaignStats, sessions, events],
  );

  const loading =
    sessionsQ.isLoading || eventsQ.isLoading || campaignsQ.isLoading || pagesQ.isLoading;

  const refetchAll = () => {
    sessionsQ.refetch();
    eventsQ.refetch();
    campaignsQ.refetch();
  };

  const exportCampaigns = (kind: "csv" | "xls") => {
    const rows = campaignStats.map((c) => ({
      name: c.campaign.name,
      status: c.campaign.status,
      utm_source: c.campaign.utm_source,
      utm_medium: c.campaign.utm_medium,
      utm_campaign: c.campaign.utm_campaign,
      visitors: c.visitors,
      views: c.views,
      clicks: c.clicks,
      conversions: c.conversions,
      ctr_pct: Number(c.ctr.toFixed(2)),
      conversion_rate_pct: Number(c.conversionRate.toFixed(2)),
    }));
    const name = `campaigns_${range.from.toISOString().slice(0, 10)}_${range.to.toISOString().slice(0, 10)}`;
    kind === "csv" ? downloadCsv(name, rows) : downloadExcel(name, rows);
  };
  const exportSources = (kind: "csv" | "xls") => {
    const rows = sources.map((s) => ({
      source: s.label,
      visitors: s.visitors,
      views: s.views,
      clicks: s.clicks,
      conversions: s.conversions,
      ctr_pct: Number(s.ctr.toFixed(2)),
      conversion_rate_pct: Number(s.conversionRate.toFixed(2)),
    }));
    const name = `sources_${touch}_touch_${range.from.toISOString().slice(0, 10)}`;
    kind === "csv" ? downloadCsv(name, rows) : downloadExcel(name, rows);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Select value={rangeKey} onValueChange={(v) => setRangeKey(v as RangeKey)}>
            <SelectTrigger className="w-[170px]">
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
          <Select value={touch} onValueChange={(v) => setTouch(v as TouchModel)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last">Last-touch attribution</SelectItem>
              <SelectItem value="first">First-touch attribution</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refetchAll} aria-label="Refresh">
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportCampaigns("csv")}>
              Campaigns — CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportCampaigns("xls")}>
              Campaigns — Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportSources("csv")}>
              Sources — CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportSources("xls")}>
              Sources — Excel
            </DropdownMenuItem>
            <DropdownMenuItem disabled>PDF (coming soon)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Attributed visitors"
          value={loading ? "—" : fmt(kpis.totalVisitors)}
          icon={Users}
        />
        <KpiCard
          label="Conversion rate"
          value={loading ? "—" : pct(kpis.overallConversionRate)}
          icon={Percent}
          hint={`${fmt(kpis.totalConversions)} conversions`}
        />
        <KpiCard
          label="Best source"
          value={loading ? "—" : kpis.bestSource ? kpis.bestSource.label : "No data"}
          icon={Award}
          hint={
            kpis.bestSource
              ? `${fmt(kpis.bestSource.visitors)} visitors • ${pct(kpis.bestSource.conversionRate)} conv.`
              : undefined
          }
        />
        <KpiCard
          label="Best campaign"
          value={loading ? "—" : kpis.bestCampaign ? kpis.bestCampaign.campaign.name : "No data"}
          icon={Megaphone}
          hint={
            kpis.bestCampaign
              ? `${fmt(kpis.bestCampaign.conversions)} conv. • ${pct(kpis.bestCampaign.conversionRate)}`
              : undefined
          }
        />
      </div>

      <Tabs defaultValue="attribution">
        <TabsList>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="builder">UTM Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="attribution" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Channel breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Traffic channels</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : channels.length === 0 ? (
                  <EmptyBlock>No traffic in this range yet.</EmptyBlock>
                ) : (
                  <ul className="space-y-3">
                    {channels.map((c) => {
                      const max = channels[0]?.visitors || 1;
                      return (
                        <li key={c.channel} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{c.channel}</span>
                            <span className="tabular-nums text-muted-foreground">
                              {fmt(c.visitors)} visitors • {pct(c.conversionRate)} conv.
                            </span>
                          </div>
                          <Progress value={(c.visitors / max) * 100} className="h-1.5" />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Known source performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Source performance</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Visitors</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Conv.</TableHead>
                          <TableHead className="text-right">CR</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {knownSources.map((s) => (
                          <TableRow key={s.key}>
                            <TableCell className="font-medium">{s.label}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmt(s.visitors)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmt(s.clicks)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {fmt(s.conversions)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {pct(s.conversionRate)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Campaign comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>Campaign comparison</span>
                {kpis.worstCampaign && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3" />
                    Underperforming: {kpis.worstCampaign.campaign.name}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : campaignStats.filter((c) => c.visitors > 0).length === 0 ? (
                <EmptyBlock>No campaign traffic in this range yet.</EmptyBlock>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Source / Medium</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Conv.</TableHead>
                        <TableHead className="text-right">CTR</TableHead>
                        <TableHead className="text-right">CR</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignStats.map((c) => (
                        <TableRow key={c.campaign.id}>
                          <TableCell>
                            <div className="flex items-center gap-2 font-medium">
                              {c.campaign.name}
                              {kpis.bestCampaign?.campaign.id === c.campaign.id && (
                                <Badge variant="default" className="gap-1">
                                  <TrendingUp className="h-3 w-3" /> Top
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {c.campaign.utm_campaign}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="font-mono">{c.campaign.utm_source}</span>
                            <span className="mx-1 text-muted-foreground">/</span>
                            <span className="font-mono">{c.campaign.utm_medium}</span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(c.visitors)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(c.views)}</TableCell>
                          <TableCell className="text-right tabular-nums">{fmt(c.clicks)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {fmt(c.conversions)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{pct(c.ctr)}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {pct(c.conversionRate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* All sources */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                Source comparison ({touch === "last" ? "last-touch" : "first-touch"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-24 w-full" />
              ) : sources.length === 0 ? (
                <EmptyBlock>No attributed traffic in this range yet.</EmptyBlock>
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sources.slice(0, 12).map((s) => (
                    <li
                      key={s.key}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                    >
                      <span className="truncate text-sm font-medium" title={s.label}>
                        {prettySource(s.key)}
                      </span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        {fmt(s.visitors)} • {pct(s.conversionRate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsManager workspaceId={workspaceId} pages={pages} />
        </TabsContent>

        <TabsContent value="builder" className="mt-4">
          <UtmBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyBlock({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
