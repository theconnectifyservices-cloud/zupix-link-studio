/**
 * Visitor Intelligence engine — pure aggregators over EventRow / SessionRow.
 * All calculations happen client-side over a range's dataset so the UI can
 * remain reactive; swap for RPCs when workspaces cross ~100k events/range.
 */
import type { EventRow, SessionRow, PageMeta, DateRange } from "./api";

export interface EngagementMetrics {
  avgTimeOnPageMs: number;
  avgScrollDepth: number;
  interactionRate: number; // sessions with clicks / total sessions
  engagementScore: number; // 0-100
  bounceRate: number; // 0-100
  returnVisitorRate: number; // 0-100
}

export function computeEngagement(sessions: SessionRow[]): EngagementMetrics {
  if (sessions.length === 0) {
    return {
      avgTimeOnPageMs: 0,
      avgScrollDepth: 0,
      interactionRate: 0,
      engagementScore: 0,
      bounceRate: 0,
      returnVisitorRate: 0,
    };
  }
  const withDuration = sessions.filter((s) => s.duration_ms > 0);
  const avgTimeOnPageMs =
    withDuration.reduce((a, s) => a + s.duration_ms, 0) / (withDuration.length || 1);
  const avgScrollDepth =
    sessions.reduce((a, s) => a + (s.max_scroll_pct ?? 0), 0) / sessions.length;
  const interacted = sessions.filter((s) => s.link_clicks > 0).length;
  const engagementScore =
    sessions.reduce((a, s) => a + (s.engagement_score ?? 0), 0) / sessions.length;
  const bounced = sessions.filter((s) => s.is_bounce).length;
  const returning = sessions.filter((s) => s.is_returning).length;
  return {
    avgTimeOnPageMs,
    avgScrollDepth,
    interactionRate: (interacted / sessions.length) * 100,
    engagementScore,
    bounceRate: (bounced / sessions.length) * 100,
    returnVisitorRate: (returning / sessions.length) * 100,
  };
}

/* ---------------------- Button / Block performance --------------------- */

export interface ButtonStat {
  url: string;
  host: string;
  label: string;
  clicks: number;
  ctr: number; // clicks / total views for the button's page
  blockType: string | null;
  rank: number;
}

export function buttonPerformance(events: EventRow[]): ButtonStat[] {
  const clicks = events.filter((e) => e.event_type === "link_click");
  const views = events.filter((e) => e.event_type === "page_view").length || 1;
  const map = new Map<string, ButtonStat>();
  for (const c of clicks) {
    if (!c.link_url) continue;
    const cur = map.get(c.link_url) ?? {
      url: c.link_url,
      host: c.link_host ?? "",
      label: c.link_host ?? c.link_url,
      blockType: c.block_type,
      clicks: 0,
      ctr: 0,
      rank: 0,
    };
    cur.clicks += 1;
    map.set(c.link_url, cur);
  }
  const arr = Array.from(map.values())
    .map((b) => ({ ...b, ctr: (b.clicks / views) * 100 }))
    .sort((a, b) => b.clicks - a.clicks)
    .map((b, i) => ({ ...b, rank: i + 1 }));
  return arr;
}

export interface BlockStat {
  blockType: string;
  clicks: number;
  uniqueVisitors: number;
  ctr: number;
}

export function blockPerformance(events: EventRow[]): BlockStat[] {
  const clicks = events.filter((e) => e.event_type === "link_click" && e.block_type);
  const views = events.filter((e) => e.event_type === "page_view").length || 1;
  const map = new Map<string, { clicks: number; visitors: Set<string> }>();
  for (const c of clicks) {
    const bt = c.block_type ?? "unknown";
    let e = map.get(bt);
    if (!e) {
      e = { clicks: 0, visitors: new Set() };
      map.set(bt, e);
    }
    e.clicks += 1;
    e.visitors.add(c.visitor_hash);
  }
  return Array.from(map, ([blockType, v]) => ({
    blockType,
    clicks: v.clicks,
    uniqueVisitors: v.visitors.size,
    ctr: (v.clicks / views) * 100,
  })).sort((a, b) => b.clicks - a.clicks);
}

/* --------------------------- Page performance -------------------------- */

export interface PageStat {
  pageId: string;
  name: string;
  slug: string;
  views: number;
  clicks: number;
  visitors: number;
  ctr: number;
  avgEngagement: number;
}

export function pagePerformance(
  events: EventRow[],
  sessions: SessionRow[],
  pages: PageMeta[],
): PageStat[] {
  const pageMap = new Map(pages.map((p) => [p.id, p]));
  const stats = new Map<string, PageStat>();
  for (const p of pages) {
    stats.set(p.id, {
      pageId: p.id,
      name: p.name,
      slug: p.slug,
      views: 0,
      clicks: 0,
      visitors: 0,
      ctr: 0,
      avgEngagement: 0,
    });
  }
  const visitorsByPage = new Map<string, Set<string>>();
  const engagementByPage = new Map<string, number[]>();
  for (const e of events) {
    const s = stats.get(e.bio_page_id);
    if (!s) continue;
    if (e.event_type === "page_view") s.views += 1;
    else if (e.event_type === "link_click") s.clicks += 1;
  }
  for (const sess of sessions) {
    if (!pageMap.has(sess.bio_page_id)) continue;
    let vs = visitorsByPage.get(sess.bio_page_id);
    if (!vs) {
      vs = new Set();
      visitorsByPage.set(sess.bio_page_id, vs);
    }
    vs.add(sess.visitor_hash);
    let es = engagementByPage.get(sess.bio_page_id);
    if (!es) {
      es = [];
      engagementByPage.set(sess.bio_page_id, es);
    }
    es.push(sess.engagement_score ?? 0);
  }
  for (const s of stats.values()) {
    s.visitors = visitorsByPage.get(s.pageId)?.size ?? 0;
    s.ctr = s.views > 0 ? (s.clicks / s.views) * 100 : 0;
    const arr = engagementByPage.get(s.pageId) ?? [];
    s.avgEngagement = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
  return Array.from(stats.values())
    .filter((s) => s.views > 0 || s.visitors > 0)
    .sort((a, b) => b.views - a.views);
}

/* --------------------------- Device behaviour -------------------------- */

export interface DeviceBehaviour {
  device: string;
  sessions: number;
  avgTimeMs: number;
  avgClicks: number;
  avgScroll: number;
  avgEngagement: number;
  bounceRate: number;
}

export function deviceBehaviour(sessions: SessionRow[]): DeviceBehaviour[] {
  const groups = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const g = groups.get(s.device_type) ?? [];
    g.push(s);
    groups.set(s.device_type, g);
  }
  return Array.from(groups, ([device, rows]) => {
    const n = rows.length;
    return {
      device,
      sessions: n,
      avgTimeMs: rows.reduce((a, s) => a + s.duration_ms, 0) / n,
      avgClicks: rows.reduce((a, s) => a + s.link_clicks, 0) / n,
      avgScroll: rows.reduce((a, s) => a + (s.max_scroll_pct ?? 0), 0) / n,
      avgEngagement: rows.reduce((a, s) => a + (s.engagement_score ?? 0), 0) / n,
      bounceRate: (rows.filter((s) => s.is_bounce).length / n) * 100,
    };
  }).sort((a, b) => b.sessions - a.sessions);
}

/* ---------------------------- Referrer perf --------------------------- */

export interface ReferrerStat {
  source: string;
  sessions: number;
  clicks: number;
  ctr: number;
  avgEngagement: number;
}

export function referrerInsights(
  events: EventRow[],
  sessions: SessionRow[],
): ReferrerStat[] {
  const bySource = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const k = s.referrer_source ?? "direct";
    const arr = bySource.get(k) ?? [];
    arr.push(s);
    bySource.set(k, arr);
  }
  const clicksBySource = new Map<string, number>();
  const viewsBySource = new Map<string, number>();
  for (const e of events) {
    const k = e.referrer_source ?? "direct";
    if (e.event_type === "link_click") clicksBySource.set(k, (clicksBySource.get(k) ?? 0) + 1);
    else if (e.event_type === "page_view") viewsBySource.set(k, (viewsBySource.get(k) ?? 0) + 1);
  }
  return Array.from(bySource, ([source, rows]) => {
    const views = viewsBySource.get(source) ?? rows.length;
    const clicks = clicksBySource.get(source) ?? 0;
    const avgEng = rows.reduce((a, s) => a + (s.engagement_score ?? 0), 0) / rows.length;
    return {
      source,
      sessions: rows.length,
      clicks,
      ctr: views > 0 ? (clicks / views) * 100 : 0,
      avgEngagement: avgEng,
    };
  }).sort((a, b) => b.sessions - a.sessions);
}

/* ------------------------- Returning visitors ------------------------- */

export interface VisitorProfile {
  visitorHash: string;
  firstVisit: string;
  lastVisit: string;
  sessions: number;
  totalClicks: number;
  totalDurationMs: number;
}

export function returningVisitors(sessions: SessionRow[]): VisitorProfile[] {
  const map = new Map<string, VisitorProfile>();
  for (const s of sessions) {
    const cur = map.get(s.visitor_hash) ?? {
      visitorHash: s.visitor_hash,
      firstVisit: s.started_at,
      lastVisit: s.started_at,
      sessions: 0,
      totalClicks: 0,
      totalDurationMs: 0,
    };
    cur.sessions += 1;
    cur.totalClicks += s.link_clicks;
    cur.totalDurationMs += s.duration_ms;
    if (s.started_at < cur.firstVisit) cur.firstVisit = s.started_at;
    if (s.started_at > cur.lastVisit) cur.lastVisit = s.started_at;
    map.set(s.visitor_hash, cur);
  }
  return Array.from(map.values())
    .filter((v) => v.sessions > 1)
    .sort((a, b) => b.sessions - a.sessions);
}

/* --------------------------- Visitor journey -------------------------- */

export interface JourneyStep {
  entry: string;
  source: string;
  firstAction: string;
  exit: string;
  count: number;
}

export function visitorJourneys(
  events: EventRow[],
  sessions: SessionRow[],
  pages: PageMeta[],
): JourneyStep[] {
  const pageName = new Map(pages.map((p) => [p.id, p.name]));
  const firstClickBySession = new Map<string, EventRow>();
  const sorted = [...events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const e of sorted) {
    if (e.event_type !== "link_click" || !e.session_id) continue;
    if (!firstClickBySession.has(e.session_id)) firstClickBySession.set(e.session_id, e);
  }
  const map = new Map<string, JourneyStep>();
  for (const s of sessions) {
    const first = firstClickBySession.get(s.id);
    const entry = pageName.get(s.bio_page_id) ?? "Unknown page";
    const source = s.referrer_source ?? "direct";
    const firstAction = first
      ? `Click · ${first.link_host ?? first.link_url ?? "link"}`
      : s.is_bounce
        ? "Bounced"
        : "Viewed only";
    const exit = s.exit_url ?? entry;
    const key = `${entry}|${source}|${firstAction}|${exit}`;
    const cur = map.get(key) ?? { entry, source, firstAction, exit, count: 0 };
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

/* -------------------------- Trend comparison -------------------------- */

export interface TrendCompare {
  label: string;
  current: number;
  previous: number;
  deltaPct: number;
}

function inRange(iso: string, from: Date, to: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export function previousRange(range: DateRange): { from: Date; to: Date } {
  const span = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - span - 1),
    to: new Date(range.from.getTime() - 1),
  };
}

export function trendCompare(
  events: EventRow[],
  sessions: SessionRow[],
  range: DateRange,
): TrendCompare[] {
  const prev = previousRange(range);
  const curEvents = events.filter((e) => inRange(e.created_at, range.from, range.to));
  const prevEvents = events.filter((e) => inRange(e.created_at, prev.from, prev.to));
  const curSessions = sessions.filter((s) => inRange(s.started_at, range.from, range.to));
  const prevSessions = sessions.filter((s) => inRange(s.started_at, prev.from, prev.to));

  const build = (label: string, current: number, previous: number): TrendCompare => ({
    label,
    current,
    previous,
    deltaPct: previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0,
  });

  return [
    build(
      "Views",
      curEvents.filter((e) => e.event_type === "page_view").length,
      prevEvents.filter((e) => e.event_type === "page_view").length,
    ),
    build(
      "Clicks",
      curEvents.filter((e) => e.event_type === "link_click").length,
      prevEvents.filter((e) => e.event_type === "link_click").length,
    ),
    build(
      "Visitors",
      new Set(curSessions.map((s) => s.visitor_hash)).size,
      new Set(prevSessions.map((s) => s.visitor_hash)).size,
    ),
    build("Sessions", curSessions.length, prevSessions.length),
  ];
}

export function formatDuration(ms: number): string {
  if (!ms || ms < 1000) return "0s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}
