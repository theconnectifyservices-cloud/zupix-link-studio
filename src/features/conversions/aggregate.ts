/** Pure conversion aggregators. */
import type { EventRow, SessionRow, PageMeta } from "@/features/analytics/api";
import type { Goal, MatchRules } from "./api";

export function eventMatchesGoal(e: EventRow, goal: Goal): boolean {
  const r: MatchRules = goal.match_rules ?? {};
  // Type gate
  if (goal.goal_type === "qr_scan") {
    if (e.event_type !== "qr_scan") return false;
    if (r.qrSource && e.qr_source !== r.qrSource) return false;
    return true;
  }
  if (goal.goal_type === "form_submit") {
    return e.event_type === "link_click" && (e.block_type === "form" || r.blockType === e.block_type);
  }
  // Everything else = link click
  if (e.event_type !== "link_click") return false;
  const url = (e.link_url ?? "").toLowerCase();
  const host = (e.link_host ?? "").toLowerCase();
  if (r.urlEquals && url !== r.urlEquals.toLowerCase()) return false;
  if (r.urlContains && !url.includes(r.urlContains.toLowerCase())) return false;
  if (r.host && host !== r.host.toLowerCase()) return false;
  if (r.blockType && e.block_type !== r.blockType) return false;
  if (r.blockId && e.block_id !== r.blockId) return false;
  // Scope by page if set
  if (goal.bio_page_id && e.bio_page_id !== goal.bio_page_id) return false;
  return true;
}

export interface GoalStat {
  goal: Goal;
  conversions: number;
  uniqueVisitors: number;
  conversionRate: number; // vs unique visitors in range
  completionPct: number | null; // vs target_value
}

export function goalStats(events: EventRow[], sessions: SessionRow[], goals: Goal[]): GoalStat[] {
  const uniqueVisitors = new Set(sessions.map((s) => s.visitor_hash)).size;
  return goals.map((goal) => {
    const matched = events.filter((e) => eventMatchesGoal(e, goal));
    const conversions = matched.length;
    const visitors = new Set(matched.map((e) => e.visitor_hash)).size;
    const conversionRate = uniqueVisitors > 0 ? (visitors / uniqueVisitors) * 100 : 0;
    const completionPct =
      goal.target_value && goal.target_value > 0
        ? Math.min(100, (conversions / goal.target_value) * 100)
        : null;
    return { goal, conversions, uniqueVisitors: visitors, conversionRate, completionPct };
  });
}

export interface ConversionKpis {
  totalConversions: number;
  conversionRate: number;
  topGoal: GoalStat | null;
  lowestGoal: GoalStat | null;
  avgCompletion: number | null;
}

export function conversionKpis(stats: GoalStat[], sessions: SessionRow[]): ConversionKpis {
  const totalConversions = stats.reduce((n, s) => n + s.conversions, 0);
  const uniqueVisitors = new Set(sessions.map((s) => s.visitor_hash)).size;
  const conversionRate = uniqueVisitors > 0 ? (totalConversions / uniqueVisitors) * 100 : 0;
  const active = stats.filter((s) => s.goal.enabled);
  const sorted = [...active].sort((a, b) => b.conversions - a.conversions);
  const withCompletion = active.filter((s) => s.completionPct !== null);
  const avgCompletion =
    withCompletion.length > 0
      ? withCompletion.reduce((n, s) => n + (s.completionPct ?? 0), 0) / withCompletion.length
      : null;
  return {
    totalConversions,
    conversionRate,
    topGoal: sorted[0] ?? null,
    lowestGoal: sorted.length > 1 ? sorted[sorted.length - 1] : null,
    avgCompletion,
  };
}

export interface CtaStat {
  key: string;
  label: string;
  host: string;
  url: string;
  views: number;
  clicks: number;
  ctr: number;
  conversionPct: number;
  rank: number;
}

/** Every clickable link becomes a CTA candidate. Views = total page_views in same page(s) as the CTA. */
export function ctaPerformance(events: EventRow[], goals: Goal[]): CtaStat[] {
  const clicksByUrl = new Map<string, { count: number; host: string; pages: Set<string> }>();
  for (const e of events) {
    if (e.event_type !== "link_click" || !e.link_url) continue;
    const bucket = clicksByUrl.get(e.link_url) ?? {
      count: 0,
      host: e.link_host ?? "",
      pages: new Set<string>(),
    };
    bucket.count += 1;
    if (e.bio_page_id) bucket.pages.add(e.bio_page_id);
    clicksByUrl.set(e.link_url, bucket);
  }
  const viewsByPage = new Map<string, number>();
  for (const e of events) {
    if (e.event_type !== "page_view") continue;
    viewsByPage.set(e.bio_page_id, (viewsByPage.get(e.bio_page_id) ?? 0) + 1);
  }
  const activeGoals = goals.filter((g) => g.enabled);
  const isConversion = (url: string, host: string) =>
    activeGoals.some((g) => {
      const r = g.match_rules ?? {};
      if (r.urlEquals && url.toLowerCase() === r.urlEquals.toLowerCase()) return true;
      if (r.urlContains && url.toLowerCase().includes(r.urlContains.toLowerCase())) return true;
      if (r.host && host.toLowerCase() === r.host.toLowerCase()) return true;
      return false;
    });
  const stats: CtaStat[] = Array.from(clicksByUrl.entries()).map(([url, b]) => {
    const views = Array.from(b.pages).reduce((n, id) => n + (viewsByPage.get(id) ?? 0), 0);
    const ctr = views > 0 ? (b.count / views) * 100 : 0;
    const conversionPct = isConversion(url, b.host) ? 100 : 0;
    return {
      key: url,
      label: b.host || url,
      host: b.host,
      url,
      views,
      clicks: b.count,
      ctr,
      conversionPct,
      rank: 0,
    };
  });
  stats.sort((a, b) => b.clicks - a.clicks);
  stats.forEach((s, i) => (s.rank = i + 1));
  return stats;
}

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  dropoffPct: number;
}

export function funnelStages(
  events: EventRow[],
  sessions: SessionRow[],
  goals: Goal[],
): FunnelStage[] {
  const visitors = new Set(sessions.map((s) => s.visitor_hash)).size;
  const viewers = new Set(
    events.filter((e) => e.event_type === "page_view").map((e) => e.visitor_hash),
  ).size;
  const clickers = new Set(
    events.filter((e) => e.event_type === "link_click").map((e) => e.visitor_hash),
  ).size;
  const activeGoals = goals.filter((g) => g.enabled);
  const converters = new Set(
    events
      .filter((e) => activeGoals.some((g) => eventMatchesGoal(e, g)))
      .map((e) => e.visitor_hash),
  ).size;
  const raw = [
    { key: "visitor", label: "Visitor", count: visitors },
    { key: "view", label: "Profile View", count: viewers },
    { key: "click", label: "Button Click", count: clickers },
    { key: "goal", label: "Goal Completion", count: converters },
  ];
  return raw.map((s, i) => {
    const prev = i > 0 ? raw[i - 1].count : s.count;
    const dropoffPct = prev > 0 ? Math.max(0, ((prev - s.count) / prev) * 100) : 0;
    return { ...s, dropoffPct: i === 0 ? 0 : dropoffPct };
  });
}

export interface PageConvStat {
  pageId: string;
  name: string;
  views: number;
  conversions: number;
  conversionPct: number;
  engagementPct: number;
}

export function pageConversion(
  events: EventRow[],
  sessions: SessionRow[],
  goals: Goal[],
  pages: PageMeta[],
): PageConvStat[] {
  const activeGoals = goals.filter((g) => g.enabled);
  const byPage = new Map<string, { views: number; conv: number; engagement: number[] }>();
  for (const p of pages) byPage.set(p.id, { views: 0, conv: 0, engagement: [] });
  for (const e of events) {
    const b = byPage.get(e.bio_page_id);
    if (!b) continue;
    if (e.event_type === "page_view") b.views += 1;
    if (activeGoals.some((g) => eventMatchesGoal(e, g))) b.conv += 1;
  }
  for (const s of sessions) {
    const b = byPage.get(s.bio_page_id);
    if (!b) continue;
    b.engagement.push(s.engagement_score ?? 0);
  }
  return pages
    .map((p) => {
      const b = byPage.get(p.id)!;
      const conversionPct = b.views > 0 ? (b.conv / b.views) * 100 : 0;
      const engagementPct =
        b.engagement.length > 0 ? b.engagement.reduce((n, v) => n + v, 0) / b.engagement.length : 0;
      return {
        pageId: p.id,
        name: p.name,
        views: b.views,
        conversions: b.conv,
        conversionPct,
        engagementPct,
      };
    })
    .sort((a, b) => b.conversionPct - a.conversionPct);
}

export interface DeviceConvRow {
  device: string;
  visitors: number;
  conversions: number;
  conversionPct: number;
}

export function deviceConversion(
  events: EventRow[],
  sessions: SessionRow[],
  goals: Goal[],
): DeviceConvRow[] {
  const activeGoals = goals.filter((g) => g.enabled);
  const visitorsByDevice = new Map<string, Set<string>>();
  for (const s of sessions) {
    const k = s.device_type || "unknown";
    let set = visitorsByDevice.get(k);
    if (!set) {
      set = new Set();
      visitorsByDevice.set(k, set);
    }
    set.add(s.visitor_hash);
  }
  const convByDevice = new Map<string, number>();
  for (const e of events) {
    if (!activeGoals.some((g) => eventMatchesGoal(e, g))) continue;
    const k = e.device_type || "unknown";
    convByDevice.set(k, (convByDevice.get(k) ?? 0) + 1);
  }
  return Array.from(visitorsByDevice.entries())
    .map(([device, set]) => {
      const conversions = convByDevice.get(device) ?? 0;
      const conversionPct = set.size > 0 ? (conversions / set.size) * 100 : 0;
      return { device, visitors: set.size, conversions, conversionPct };
    })
    .sort((a, b) => b.conversionPct - a.conversionPct);
}

export interface ReferralConvRow {
  source: string;
  visitors: number;
  conversions: number;
  conversionPct: number;
}

const KNOWN_SOURCES = [
  "google",
  "instagram",
  "facebook",
  "whatsapp",
  "telegram",
  "linkedin",
  "twitter",
  "direct",
];

export function referralConversion(
  events: EventRow[],
  sessions: SessionRow[],
  goals: Goal[],
): ReferralConvRow[] {
  const activeGoals = goals.filter((g) => g.enabled);
  const norm = (s: string | null | undefined) => {
    const v = (s ?? "direct").toLowerCase();
    if (v === "x" || v === "t.co") return "twitter";
    return v;
  };
  const visitorsBySource = new Map<string, Set<string>>();
  for (const s of sessions) {
    const k = norm(s.referrer_source);
    let set = visitorsBySource.get(k);
    if (!set) {
      set = new Set();
      visitorsBySource.set(k, set);
    }
    set.add(s.visitor_hash);
  }
  const convBySource = new Map<string, number>();
  for (const e of events) {
    if (!activeGoals.some((g) => eventMatchesGoal(e, g))) continue;
    const k = norm(e.referrer_source);
    convBySource.set(k, (convBySource.get(k) ?? 0) + 1);
  }
  const keys = new Set<string>([...visitorsBySource.keys(), ...KNOWN_SOURCES]);
  return Array.from(keys)
    .map((source) => {
      const visitors = visitorsBySource.get(source)?.size ?? 0;
      const conversions = convBySource.get(source) ?? 0;
      const conversionPct = visitors > 0 ? (conversions / visitors) * 100 : 0;
      return { source, visitors, conversions, conversionPct };
    })
    .filter((r) => r.visitors > 0 || r.conversions > 0)
    .sort((a, b) => b.conversions - a.conversions);
}
