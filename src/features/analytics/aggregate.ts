/** Pure aggregators over EventRow / SessionRow / Business data. */
import type { EventRow, SessionRow, DateRange } from "./api";
import type { Lead, Booking } from "@/features/business/api";

export interface BusinessKpis {
  totalViews: number;
  uniqueVisitors: number;
  returningVisitors: number;
  totalClicks: number;
  ctr: number;
  qrScans: number;
  // Business specific
  leads: number;
  bookings: number;
  conversionRate: number;
  revenue: number;
  successfulPayments: number;
}

export function computeKpis(
  events: EventRow[], 
  sessions: SessionRow[], 
  leads: Lead[] = [], 
  bookings: Booking[] = []
): BusinessKpis {
  const totalViews = events.filter((e) => e.event_type === "page_view").length;
  const totalClicks = events.filter((e) => e.event_type === "link_click").length;
  const qrScans = events.filter((e) => e.event_type === "qr_scan").length;
  const visitors = new Set(sessions.map((s) => s.visitor_hash));
  const returning = new Set(sessions.filter((s) => s.is_returning).map((s) => s.visitor_hash));
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  
  const leadCount = leads.length;
  const bookingCount = bookings.length;
  const totalConversions = leadCount + bookingCount;
  const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

  return {
    totalViews,
    uniqueVisitors: visitors.size,
    returningVisitors: returning.size,
    totalClicks,
    ctr,
    qrScans,
    leads: leadCount,
    bookings: bookingCount,
    conversionRate,
    revenue: 0, // Placeholder for payment integration
    successfulPayments: 0, // Placeholder
  };
}

export type Bucket = "hour" | "day" | "week" | "month";

export function pickBucket(range: DateRange): Bucket {
  const days = Math.ceil((range.to.getTime() - range.from.getTime()) / 86_400_000);
  if (days <= 1) return "hour";
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

function truncate(d: Date, bucket: Bucket): Date {
  const x = new Date(d);
  if (bucket === "hour") {
    x.setMinutes(0, 0, 0);
    return x;
  }
  x.setHours(0, 0, 0, 0);
  if (bucket === "day") return x;
  if (bucket === "week") {
    const day = x.getDay();
    x.setDate(x.getDate() - day);
    return x;
  }
  x.setDate(1);
  return x;
}

export interface TimePoint {
  ts: string;
  label: string;
  views: number;
  clicks: number;
  visitors: number;
}

export function bucketTimeseries(
  events: EventRow[],
  sessions: SessionRow[],
  range: DateRange,
  bucket: Bucket,
): TimePoint[] {
  const map = new Map<string, TimePoint>();
  const step = (d: Date) => {
    if (bucket === "hour") d.setHours(d.getHours() + 1);
    else if (bucket === "day") d.setDate(d.getDate() + 1);
    else if (bucket === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  };
  const cursor = truncate(range.from, bucket);
  const end = truncate(range.to, bucket);
  while (cursor <= end) {
    const key = cursor.toISOString();
    map.set(key, {
      ts: key,
      label: formatLabel(cursor, bucket),
      views: 0,
      clicks: 0,
      visitors: 0,
    });
    step(cursor);
  }
  const visitorsByBucket = new Map<string, Set<string>>();
  for (const e of events) {
    const key = truncate(new Date(e.created_at), bucket).toISOString();
    const p = map.get(key);
    if (!p) continue;
    if (e.event_type === "page_view") p.views += 1;
    else if (e.event_type === "link_click") p.clicks += 1;
  }
  for (const s of sessions) {
    const key = truncate(new Date(s.started_at), bucket).toISOString();
    let set = visitorsByBucket.get(key);
    if (!set) {
      set = new Set();
      visitorsByBucket.set(key, set);
    }
    set.add(s.visitor_hash);
  }
  for (const [key, set] of visitorsByBucket) {
    const p = map.get(key);
    if (p) p.visitors = set.size;
  }
  return Array.from(map.values());
}

function formatLabel(d: Date, bucket: Bucket): string {
  if (bucket === "hour") return d.toLocaleTimeString([], { hour: "2-digit" });
  if (bucket === "day") return d.toLocaleDateString([], { month: "short", day: "numeric" });
  if (bucket === "week") return `Wk ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  return d.toLocaleDateString([], { month: "short", year: "2-digit" });
}

export interface Slice {
  key: string;
  label: string;
  count: number;
}

export function groupCount<T>(items: T[], keyFn: (i: T) => string | null): Slice[] {
  const map = new Map<string, number>();
  for (const i of items) {
    const k = keyFn(i) ?? "Unknown";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map, ([key, count]) => ({ key, label: key, count })).sort(
    (a, b) => b.count - a.count,
  );
}

export function deviceMix(events: EventRow[]) {
  const views = events.filter((e) => e.event_type === "page_view");
  const total = views.length || 1;
  const grouped = groupCount(views, (e) => e.device_type);
  return grouped.map((g) => ({ ...g, pct: (g.count / total) * 100 }));
}

export interface LinkStat {
  url: string;
  host: string;
  clicks: number;
  ctr: number;
}

export function linkPerformance(events: EventRow[]): LinkStat[] {
  const viewsByBlock = new Map<string, number>();
  const clicksByUrl = new Map<string, { url: string; host: string; clicks: number }>();
  
  for (const e of events) {
    if (e.event_type === "page_view") {
      // In a real scenario, we'd need page-level view data or block-level view impressions
      // For now, we'll use total page views as the denominator for rough CTR if blockId is missing
    }
    if (e.event_type === "link_click" && e.link_url) {
      const cur = clicksByUrl.get(e.link_url) ?? { url: e.link_url, host: e.link_host ?? "", clicks: 0 };
      cur.clicks += 1;
      clicksByUrl.set(e.link_url, cur);
    }
  }

  const totalViews = events.filter(e => e.event_type === "page_view").length || 1;

  return Array.from(clicksByUrl.values())
    .map(c => ({
      ...c,
      ctr: (c.clicks / totalViews) * 100
    }))
    .sort((a, b) => b.clicks - a.clicks);
}

export function trafficSources(events: EventRow[]): Slice[] {
  const views = events.filter(e => e.event_type === "page_view");
  return groupCount(views, (e) => e.referrer_source || "Direct");
}
