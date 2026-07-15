/**
 * Public analytics ingestion endpoint.
 *
 * - No auth (bypasses via `/api/public/`), so every write is validated
 *   server-side against the target bio_pages row before touching the DB.
 * - IP + UA never stored raw: a rotating daily HMAC produces a visitor_hash.
 * - Geo comes from Cloudflare Workers request headers (`cf-*`).
 * - Session upsert is idempotent per (bio_page_id, session_key), so
 *   duplicate client sends never inflate counts.
 */

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHmac } from "node:crypto";

const DeviceSchema = z.object({
  type: z.enum(["mobile", "tablet", "desktop", "bot", "unknown"]),
  browser: z.string().max(40),
  os: z.string().max(40),
  screen: z.string().max(20),
  dpr: z.number().min(0).max(10),
});

const EnvelopeSchema = z.object({
  pageId: z.string().uuid(),
  slug: z.string().min(1).max(80),
  sessionKey: z.string().uuid(),
  sessionStartedAt: z.number().int().nonnegative(),
  isReturning: z.boolean(),
  visitorId: z.string().max(80),
  device: DeviceSchema,
  referrer: z.string().max(2048).nullable(),
  utm: z.object({
    source: z.string().max(120).nullable().optional(),
    medium: z.string().max(120).nullable().optional(),
    campaign: z.string().max(120).nullable().optional(),
    term: z.string().max(120).nullable().optional(),
    content: z.string().max(120).nullable().optional(),
  }),
  timezone: z.string().max(80).nullable(),
  qrSource: z.string().max(80).nullable(),
});

const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("page_view") }),
  z.object({
    type: z.literal("link_click"),
    blockId: z.string().max(80).optional(),
    blockType: z.string().max(40).optional(),
    linkUrl: z.string().max(2048),
    clickSource: z.string().max(40).optional(),
  }),
  z.object({ type: z.literal("qr_scan"), qrSource: z.string().max(80).optional() }),
  z.object({
    type: z.literal("session_end"),
    durationMs: z.number().int().min(0).max(24 * 60 * 60 * 1000),
    pageViews: z.number().int().min(0).max(10_000),
    linkClicks: z.number().int().min(0).max(10_000),
  }),
]);

const PayloadSchema = z.object({ envelope: EnvelopeSchema, event: EventSchema });

const BOT_RE =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|pinterest|whatsapp|telegram|twitterbot|linkedinbot|discordbot|preview|monitor|lighthouse|headlesschrome|phantomjs|puppeteer/i;

/** Best-effort in-memory rate limit; per-worker isolate, ~200 events/min/IP. */
const bucket = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = bucket.get(ip);
  if (!b || b.resetAt < now) {
    bucket.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  b.count += 1;
  return b.count > 200;
}

function classifyReferrer(raw: string | null): { source: string; host: string | null } {
  if (!raw) return { source: "direct", host: null };
  let host: string;
  try {
    host = new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return { source: "direct", host: null };
  }
  const map: Array<[RegExp, string]> = [
    [/google\./, "google"],
    [/bing\./, "bing"],
    [/duckduckgo\./, "duckduckgo"],
    [/yahoo\./, "yahoo"],
    [/facebook\.|fb\.com|fb\.me/, "facebook"],
    [/instagram\.|instagr\.am/, "instagram"],
    [/whatsapp\.|wa\.me/, "whatsapp"],
    [/t\.me|telegram\./, "telegram"],
    [/linkedin\.|lnkd\.in/, "linkedin"],
    [/(^|\.)x\.com|twitter\.|t\.co/, "twitter"],
    [/tiktok\./, "tiktok"],
    [/youtube\.|youtu\.be/, "youtube"],
    [/pinterest\./, "pinterest"],
    [/reddit\./, "reddit"],
    [/threads\./, "threads"],
  ];
  for (const [re, name] of map) if (re.test(host)) return { source: name, host };
  return { source: "referral", host };
}

function dailySalt(): string {
  const base = process.env.ANALYTICS_HASH_SALT ?? "zx-default-salt";
  const day = new Date().toISOString().slice(0, 10);
  return `${base}:${day}`;
}

function hashVisitor(ip: string, ua: string, pageId: string, visitorId: string): string {
  return createHmac("sha256", dailySalt())
    .update(`${ip}|${ua}|${pageId}|${visitorId}`)
    .digest("hex")
    .slice(0, 40);
}

function pickIp(req: Request): string {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? fwd ?? "0.0.0.0";
}

async function handlePost(request: Request): Promise<Response> {
  const ua = request.headers.get("user-agent") ?? "";
  const ip = pickIp(request);
  if (rateLimited(ip)) return new Response("rate_limited", { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("bad_json", { status: 400 });
  }
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) return new Response("bad_payload", { status: 400 });
  const { envelope, event } = parsed.data;

  const isBotUa = BOT_RE.test(ua);
  const isBot = isBotUa || envelope.device.type === "bot";

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Validate the target page and get workspace_id
  const { data: page, error: pageErr } = await supabaseAdmin
    .from("bio_pages")
    .select("id, workspace_id, slug, status, visibility, deleted_at")
    .eq("id", envelope.pageId)
    .maybeSingle();
  if (pageErr) return new Response("db_error", { status: 500 });
  if (
    !page ||
    page.deleted_at ||
    page.status !== "published" ||
    page.slug.toLowerCase() !== envelope.slug.toLowerCase()
  ) {
    return new Response("not_found", { status: 404 });
  }

  // Silently drop bot traffic — don't waste rows
  if (isBot) return new Response(null, { status: 204 });

  const visitorHash = hashVisitor(ip, ua, envelope.pageId, envelope.visitorId);

  // Geo from Cloudflare edge headers (set by Workers when present)
  const country = request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country") ?? null;
  const region =
    request.headers.get("cf-region") ?? request.headers.get("x-vercel-ip-country-region") ?? null;
  const city = request.headers.get("cf-ipcity") ?? request.headers.get("x-vercel-ip-city") ?? null;
  const tzHeader = request.headers.get("cf-timezone");
  const timezone = tzHeader ?? envelope.timezone ?? null;

  const ref = classifyReferrer(envelope.referrer);

  // Upsert session (idempotent per session_key)
  const { data: session, error: sessErr } = await supabaseAdmin
    .from("analytics_sessions")
    .upsert(
      {
        workspace_id: page.workspace_id,
        bio_page_id: page.id,
        visitor_hash: visitorHash,
        session_key: envelope.sessionKey,
        is_returning: envelope.isReturning,
        device_type: envelope.device.type,
        browser: envelope.device.browser,
        os: envelope.device.os,
        screen_size: envelope.device.screen,
        country,
        region,
        city,
        timezone,
        referrer_source: ref.source,
        referrer_host: ref.host,
        utm_source: envelope.utm.source ?? null,
        utm_medium: envelope.utm.medium ?? null,
        utm_campaign: envelope.utm.campaign ?? null,
        qr_source: envelope.qrSource,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "bio_page_id,session_key" },
    )
    .select("id")
    .maybeSingle();
  if (sessErr || !session) return new Response("db_error", { status: 500 });

  // Update rolling session counters + insert event
  const commonEvent = {
    workspace_id: page.workspace_id,
    bio_page_id: page.id,
    session_id: session.id,
    visitor_hash: visitorHash,
    device_type: envelope.device.type,
    browser: envelope.device.browser,
    os: envelope.device.os,
    country,
    region,
    city,
    timezone,
    referrer_source: ref.source,
    referrer_host: ref.host,
    qr_source: envelope.qrSource,
    is_bot: false,
  } as const;

  if (event.type === "page_view") {
    await supabaseAdmin.from("analytics_events").insert({ ...commonEvent, event_type: "page_view" });
  } else if (event.type === "link_click") {
    let linkHost: string | null = null;
    try {
      linkHost = new URL(event.linkUrl, `https://${envelope.slug}`).hostname.replace(/^www\./, "");
    } catch {
      linkHost = null;
    }
    await supabaseAdmin.from("analytics_events").insert({
      ...commonEvent,
      event_type: "link_click",
      block_id: event.blockId ?? null,
      link_url: event.linkUrl,
      link_host: linkHost,
      click_source: event.clickSource ?? "content",
    });
  } else if (event.type === "qr_scan") {
    await supabaseAdmin.from("analytics_events").insert({
      ...commonEvent,
      event_type: "qr_scan",
      qr_source: event.qrSource ?? envelope.qrSource,
    });
  } else if (event.type === "session_end") {
    await supabaseAdmin
      .from("analytics_sessions")
      .update({
        duration_ms: event.durationMs,
        page_views: event.pageViews,
        link_clicks: event.linkClicks,
        is_bounce: event.pageViews <= 1 && event.linkClicks === 0,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    await supabaseAdmin
      .from("analytics_events")
      .insert({ ...commonEvent, event_type: "session_end", duration_ms: event.durationMs });
  }

  return new Response(null, { status: 204 });
}

function cors(res: Response): Response {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "content-type");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const Route = createFileRoute("/api/public/track")({
  server: {
    handlers: {
      POST: async ({ request }) => cors(await handlePost(request)),
      OPTIONS: async () => cors(new Response(null, { status: 204 })),
    },
  },
});
