/** Pure attribution aggregators. First/last-touch, source/campaign performance. */
import type { AttrEvent, AttrSession, Campaign } from "./api";

export type TouchModel = "first" | "last";

export interface SourceStat {
  key: string;
  label: string;
  visitors: number;
  views: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  ctr: number;
}

const SOCIAL_KEYS = new Set([
  "facebook",
  "instagram",
  "whatsapp",
  "telegram",
  "linkedin",
  "twitter",
  "tiktok",
  "youtube",
  "pinterest",
  "reddit",
  "threads",
]);
const SEARCH_KEYS = new Set(["google", "bing", "duckduckgo", "yahoo"]);

/** Trafficabelled attribution source per session: utm_source > qr_source > referrer_source > direct. */
export function attributionSource(s: AttrSession): { key: string; channel: string } {
  if (s.utm_source) return { key: s.utm_source.toLowerCase(), channel: channelOf(s.utm_source) };
  if (s.qr_source) return { key: "qr", channel: "QR" };
  const r = (s.referrer_source ?? "direct").toLowerCase();
  return { key: r, channel: channelOf(r) };
}

function channelOf(name: string): string {
  const k = name.toLowerCase();
  if (k === "qr") return "QR";
  if (k === "direct") return "Direct";
  if (SOCIAL_KEYS.has(k)) return "Social";
  if (SEARCH_KEYS.has(k)) return "Organic";
  return "Referral";
}

export function attributionSourceForEvent(e: AttrEvent): string {
  if (e.utm_source) return e.utm_source.toLowerCase();
  if (e.qr_source) return "qr";
  return (e.referrer_source ?? "direct").toLowerCase();
}

/** First-touch or last-touch attribution: pick the first/last session per visitor. */
export function attributeVisitors(
  sessions: AttrSession[],
  model: TouchModel,
): Map<string, AttrSession> {
  const byVisitor = new Map<string, AttrSession>();
  for (const s of sessions) {
    const existing = byVisitor.get(s.visitor_hash);
    if (!existing) {
      byVisitor.set(s.visitor_hash, s);
      continue;
    }
    if (model === "first") {
      if (s.started_at < existing.started_at) byVisitor.set(s.visitor_hash, s);
    } else {
      if (s.started_at > existing.started_at) byVisitor.set(s.visitor_hash, s);
    }
  }
  return byVisitor;
}

const KNOWN_SOURCES = [
  "google",
  "facebook",
  "instagram",
  "whatsapp",
  "telegram",
  "linkedin",
  "twitter",
  "direct",
  "qr",
];

export function sourceBreakdown(
  sessions: AttrSession[],
  events: AttrEvent[],
  model: TouchModel,
  includeKnownOnly = false,
): SourceStat[] {
  const attributed = attributeVisitors(sessions, model);
  const perSource = new Map<
    string,
    { visitors: Set<string>; views: number; clicks: number; conversions: number }
  >();

  const bump = (key: string) => {
    let e = perSource.get(key);
    if (!e) {
      e = { visitors: new Set(), views: 0, clicks: 0, conversions: 0 };
      perSource.set(key, e);
    }
    return e;
  };

  for (const [visitor, s] of attributed) {
    const key = attributionSource(s).key;
    bump(key).visitors.add(visitor);
  }
  // Sessions provide view/click counters
  for (const s of sessions) {
    const key = attributionSource(s).key;
    const e = bump(key);
    e.views += s.page_views;
    e.clicks += s.link_clicks;
  }
  // Conversion = link_click event (treat every click as a conversion opportunity)
  for (const ev of events) {
    if (ev.event_type !== "link_click") continue;
    const key = attributionSourceForEvent(ev);
    bump(key).conversions += 1;
  }

  const rows: SourceStat[] = Array.from(perSource.entries()).map(([key, v]) => {
    const visitors = v.visitors.size;
    return {
      key,
      label: prettySource(key),
      visitors,
      views: v.views,
      clicks: v.clicks,
      conversions: v.conversions,
      conversionRate: visitors > 0 ? (v.conversions / visitors) * 100 : 0,
      ctr: v.views > 0 ? (v.clicks / v.views) * 100 : 0,
    };
  });

  if (includeKnownOnly) {
    const known = new Set(KNOWN_SOURCES);
    // ensure every known source appears even at 0
    for (const k of KNOWN_SOURCES) {
      if (!rows.find((r) => r.key === k)) {
        rows.push({
          key: k,
          label: prettySource(k),
          visitors: 0,
          views: 0,
          clicks: 0,
          conversions: 0,
          conversionRate: 0,
          ctr: 0,
        });
      }
    }
    return rows
      .filter((r) => known.has(r.key))
      .sort((a, b) => b.visitors - a.visitors);
  }
  return rows.sort((a, b) => b.visitors - a.visitors);
}

export function prettySource(k: string): string {
  const map: Record<string, string> = {
    google: "Google",
    facebook: "Facebook",
    instagram: "Instagram",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    linkedin: "LinkedIn",
    twitter: "X (Twitter)",
    tiktok: "TikTok",
    youtube: "YouTube",
    pinterest: "Pinterest",
    reddit: "Reddit",
    threads: "Threads",
    email: "Email",
    qr: "QR",
    direct: "Direct",
    referral: "Referral",
  };
  return map[k.toLowerCase()] ?? k;
}

export interface ChannelStat {
  channel: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

export function channelBreakdown(sessions: AttrSession[], events: AttrEvent[]): ChannelStat[] {
  const attributed = attributeVisitors(sessions, "last");
  const map = new Map<string, { visitors: Set<string>; conv: number }>();
  const b = (ch: string) => {
    let e = map.get(ch);
    if (!e) {
      e = { visitors: new Set(), conv: 0 };
      map.set(ch, e);
    }
    return e;
  };
  for (const [visitor, s] of attributed) b(attributionSource(s).channel).visitors.add(visitor);
  for (const ev of events) {
    if (ev.event_type !== "link_click") continue;
    const ch = channelOf(attributionSourceForEvent(ev));
    b(ch).conv += 1;
  }
  return Array.from(map.entries())
    .map(([channel, v]) => ({
      channel,
      visitors: v.visitors.size,
      conversions: v.conv,
      conversionRate: v.visitors.size > 0 ? (v.conv / v.visitors.size) * 100 : 0,
    }))
    .sort((a, b2) => b2.visitors - a.visitors);
}

export interface CampaignStat {
  campaign: Campaign;
  visitors: number;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
}

export function campaignPerformance(
  campaigns: Campaign[],
  sessions: AttrSession[],
  events: AttrEvent[],
): CampaignStat[] {
  const byCampaign = new Map<string, { visitors: Set<string>; views: number; clicks: number; conv: number }>();
  const b = (id: string) => {
    let e = byCampaign.get(id);
    if (!e) {
      e = { visitors: new Set(), views: 0, clicks: 0, conv: 0 };
      byCampaign.set(id, e);
    }
    return e;
  };
  for (const s of sessions) {
    if (!s.campaign_id) continue;
    const e = b(s.campaign_id);
    e.visitors.add(s.visitor_hash);
    e.views += s.page_views;
    e.clicks += s.link_clicks;
  }
  for (const ev of events) {
    if (!ev.campaign_id || ev.event_type !== "link_click") continue;
    b(ev.campaign_id).conv += 1;
  }
  return campaigns
    .map((c) => {
      const v = byCampaign.get(c.id);
      const visitors = v?.visitors.size ?? 0;
      const views = v?.views ?? 0;
      const clicks = v?.clicks ?? 0;
      const conv = v?.conv ?? 0;
      return {
        campaign: c,
        visitors,
        views,
        clicks,
        conversions: conv,
        ctr: views > 0 ? (clicks / views) * 100 : 0,
        conversionRate: visitors > 0 ? (conv / visitors) * 100 : 0,
      };
    })
    .sort((a, b2) => b2.conversions - a.conversions);
}

export interface MarketingKpis {
  totalVisitors: number;
  totalConversions: number;
  overallConversionRate: number;
  bestSource: SourceStat | null;
  bestConvertingSource: SourceStat | null;
  bestCampaign: CampaignStat | null;
  worstCampaign: CampaignStat | null;
}

export function marketingKpis(
  sources: SourceStat[],
  campaignStats: CampaignStat[],
  sessions: AttrSession[],
  events: AttrEvent[],
): MarketingKpis {
  const totalVisitors = new Set(sessions.map((s) => s.visitor_hash)).size;
  const totalConversions = events.filter((e) => e.event_type === "link_click").length;
  const overallConversionRate = totalVisitors > 0 ? (totalConversions / totalVisitors) * 100 : 0;
  const activeCampaigns = campaignStats.filter((c) => c.visitors > 0);
  return {
    totalVisitors,
    totalConversions,
    overallConversionRate,
    bestSource: sources.slice().sort((a, b) => b.visitors - a.visitors)[0] ?? null,
    bestConvertingSource:
      sources
        .filter((s) => s.visitors >= 3)
        .sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null,
    bestCampaign:
      activeCampaigns.slice().sort((a, b) => b.conversions - a.conversions)[0] ?? null,
    worstCampaign:
      activeCampaigns.length > 1
        ? activeCampaigns.slice().sort((a, b) => a.conversionRate - b.conversionRate)[0]
        : null,
  };
}
