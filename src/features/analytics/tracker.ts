/**
 * Client-side analytics tracker for public bio pages.
 *
 * Design goals:
 * - Zero blocking on page load: everything runs after mount, uses `sendBeacon`
 *   when the tab is closing and `fetch(..., { keepalive: true })` otherwise.
 * - Zero PII: no IP, no exact geo, no user-agent stored raw client-side.
 *   The server does IP hashing with a rotating salt.
 * - Deduplication: a stable session key prevents inflating page views
 *   from React re-mounts. A `page_view` fires once per (page × session).
 * - Reliable delivery: failed sends land in a small localStorage retry
 *   queue and drain on the next event or the next mount.
 */

import type { ClientEnvelope, DeviceType, TrackEventInput } from "./types";

const ENDPOINT = "/api/public/track";
const VISITOR_KEY = "zx.analytics.vid";
const SESSION_KEY = "zx.analytics.sid";
const SESSION_META_KEY = "zx.analytics.smeta";
const SEEN_PV_KEY = "zx.analytics.pv"; // sessionStorage set of pageIds already counted
const RETRY_KEY = "zx.analytics.retry";
const SESSION_IDLE_MS = 30 * 60 * 1000; // 30 min

function safeLS(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function safeSS(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getOrCreateVisitorId(): { id: string; isReturning: boolean } {
  const ls = safeLS();
  if (!ls) return { id: uuid(), isReturning: false };
  const existing = ls.getItem(VISITOR_KEY);
  if (existing) return { id: existing, isReturning: true };
  const id = uuid();
  try {
    ls.setItem(VISITOR_KEY, id);
  } catch {
    /* ignore */
  }
  return { id, isReturning: false };
}

interface SessionState {
  key: string;
  startedAt: number;
  lastSeenAt: number;
  pageViews: number;
  linkClicks: number;
}

function loadSession(): SessionState | null {
  const ss = safeSS();
  if (!ss) return null;
  const raw = ss.getItem(SESSION_META_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionState;
    if (Date.now() - parsed.lastSeenAt > SESSION_IDLE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persistSession(s: SessionState) {
  const ss = safeSS();
  if (!ss) return;
  try {
    ss.setItem(SESSION_META_KEY, JSON.stringify(s));
    ss.setItem(SESSION_KEY, s.key);
  } catch {
    /* ignore */
  }
}

function getOrCreateSession(): SessionState {
  const existing = loadSession();
  if (existing) return existing;
  const s: SessionState = {
    key: uuid(),
    startedAt: Date.now(),
    lastSeenAt: Date.now(),
    pageViews: 0,
    linkClicks: 0,
  };
  persistSession(s);
  return s;
}

function detectDevice(): { type: DeviceType; browser: string; os: string; screen: string; dpr: number } {
  const ua = navigator.userAgent || "";
  const uaLower = ua.toLowerCase();

  // Bot detection (basic)
  const botRe =
    /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegram|twitterbot|linkedinbot|discordbot|preview|monitor|lighthouse|headlesschrome|phantomjs|puppeteer/i;
  if (botRe.test(ua)) {
    return { type: "bot", browser: "bot", os: "bot", screen: "0x0", dpr: 1 };
  }

  // Device type — prefer UA-CH when available
  let type: DeviceType = "desktop";
  const uaData = (navigator as unknown as { userAgentData?: { mobile?: boolean } }).userAgentData;
  const mobile = uaData?.mobile ?? /mobi|iphone|ipod|android.+mobile|windows phone/i.test(uaLower);
  const tablet = /ipad|tablet|(android(?!.*mobile))/i.test(uaLower);
  if (mobile) type = "mobile";
  else if (tablet) type = "tablet";

  // Browser
  let browser = "Other";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/firefox\//i.test(ua)) browser = "Firefox";

  // OS
  let os = "Other";
  if (/windows nt/i.test(ua)) os = "Windows";
  else if (/mac os x/i.test(ua)) os = "macOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/linux/i.test(ua)) os = "Linux";

  const screen = `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`;
  const dpr = window.devicePixelRatio || 1;
  return { type, browser, os, screen, dpr };
}

function parseUtm(search: string) {
  const p = new URLSearchParams(search);
  return {
    source: p.get("utm_source"),
    medium: p.get("utm_medium"),
    campaign: p.get("utm_campaign"),
    term: p.get("utm_term"),
    content: p.get("utm_content"),
  };
}

function getTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

function buildEnvelope(pageId: string, slug: string): ClientEnvelope {
  const visitor = getOrCreateVisitorId();
  const session = getOrCreateSession();
  const device = detectDevice();
  const search = typeof window !== "undefined" ? window.location.search : "";
  const qr = new URLSearchParams(search).get("qr");
  const entryUrl =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : null;
  return {
    pageId,
    slug,
    sessionKey: session.key,
    sessionStartedAt: session.startedAt,
    isReturning: visitor.isReturning,
    visitorId: visitor.id,
    device,
    referrer: typeof document !== "undefined" ? document.referrer || null : null,
    utm: parseUtm(search),
    timezone: getTimezone(),
    qrSource: qr,
    entryUrl,
  };
}

function computeScrollPct(): number {
  if (typeof window === "undefined") return 0;
  const doc = document.documentElement;
  const body = document.body;
  const scrollTop = window.scrollY || doc.scrollTop || 0;
  const viewport = window.innerHeight || doc.clientHeight || 0;
  const full = Math.max(doc.scrollHeight, body?.scrollHeight ?? 0);
  const denom = Math.max(1, full - viewport);
  const pct = Math.round(((scrollTop + viewport) / (denom + viewport)) * 100);
  return Math.max(0, Math.min(100, pct));
}

/* --------------------------------- send --------------------------------- */

function drainRetry() {
  const ls = safeLS();
  if (!ls) return;
  const raw = ls.getItem(RETRY_KEY);
  if (!raw) return;
  ls.removeItem(RETRY_KEY);
  let queue: TrackEventInput[] = [];
  try {
    queue = JSON.parse(raw);
  } catch {
    return;
  }
  for (const item of queue.slice(-25)) {
    void send(item, /* fromRetry */ true);
  }
}

function queueForRetry(payload: TrackEventInput) {
  const ls = safeLS();
  if (!ls) return;
  try {
    const raw = ls.getItem(RETRY_KEY);
    const queue: TrackEventInput[] = raw ? JSON.parse(raw) : [];
    queue.push(payload);
    ls.setItem(RETRY_KEY, JSON.stringify(queue.slice(-25)));
  } catch {
    /* ignore */
  }
}

async function send(payload: TrackEventInput, fromRetry = false): Promise<void> {
  const body = JSON.stringify(payload);
  // sendBeacon is best for unload; for normal events use fetch keepalive
  try {
    if (payload.event.type === "session_end" && "sendBeacon" in navigator) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
    }
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`track_${res.status}`);
  } catch {
    if (!fromRetry) queueForRetry(payload);
  }
}

/* --------------------------------- API --------------------------------- */

export interface TrackerHandle {
  trackClick: (opts: { blockId?: string; blockType?: string; linkUrl: string; clickSource?: string }) => void;
  trackQrScan: (source?: string) => void;
  end: () => void;
}

/**
 * Initialize tracking for the current page. Fires a page_view immediately
 * (deduped per session), registers a delegated link-click listener, and
 * flushes a session_end via sendBeacon on visibility=hidden.
 */
export function initTracker(pageId: string, slug: string, rootEl: HTMLElement): TrackerHandle {
  const envelope = buildEnvelope(pageId, slug);

  // Skip anything obviously non-human
  if (envelope.device.type === "bot") {
    return { trackClick: () => {}, trackQrScan: () => {}, end: () => {} };
  }

  // Drain any queued failures from a previous tab
  drainRetry();

  const session = getOrCreateSession();

  // Dedupe page_view per (page × session)
  const ss = safeSS();
  const seenKey = `${SEEN_PV_KEY}:${pageId}:${session.key}`;
  const alreadyCounted = ss?.getItem(seenKey) === "1";
  if (!alreadyCounted) {
    session.pageViews += 1;
    session.lastSeenAt = Date.now();
    persistSession(session);
    try {
      ss?.setItem(seenKey, "1");
    } catch {
      /* ignore */
    }
    void send({ envelope, event: { type: "page_view" } });
    if (envelope.qrSource) {
      void send({ envelope, event: { type: "qr_scan", qrSource: envelope.qrSource } });
    }
  }

  // Track max scroll depth
  let maxScroll = computeScrollPct();
  let scrollTimer: number | null = null;
  const onScroll = () => {
    if (scrollTimer !== null) return;
    scrollTimer = window.setTimeout(() => {
      scrollTimer = null;
      const pct = computeScrollPct();
      if (pct > maxScroll) maxScroll = pct;
    }, 200);
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // Delegated click listener
  const onClick = (ev: MouseEvent) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute("href") ?? "";
    if (!href || href.startsWith("#")) return;
    const blockEl = anchor.closest("[data-block-id]") as HTMLElement | null;
    const blockId = blockEl?.getAttribute("data-block-id") ?? undefined;
    const blockType = blockEl?.getAttribute("data-block-type") ?? undefined;
    session.linkClicks += 1;
    session.lastSeenAt = Date.now();
    persistSession(session);
    void send({
      envelope,
      event: {
        type: "link_click",
        blockId,
        blockType,
        linkUrl: href,
        clickSource: "content",
        scrollPct: computeScrollPct(),
      },
    });
  };
  rootEl.addEventListener("click", onClick, { capture: true });

  // Session-end via visibility change (best-effort)
  let ended = false;
  const onHide = () => {
    if (document.visibilityState !== "hidden" || ended) return;
    ended = true;
    const duration = Date.now() - session.startedAt;
    void send({
      envelope,
      event: {
        type: "session_end",
        durationMs: duration,
        pageViews: session.pageViews,
        linkClicks: session.linkClicks,
        maxScrollPct: maxScroll,
        exitUrl:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : null,
      },
    });
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", onHide);

  return {
    trackClick: (opts) => {
      session.linkClicks += 1;
      session.lastSeenAt = Date.now();
      persistSession(session);
      void send({
        envelope,
        event: {
          type: "link_click",
          ...opts,
          clickSource: opts.clickSource ?? "manual",
          scrollPct: computeScrollPct(),
        },
      });
    },
    trackQrScan: (source) => {
      void send({ envelope, event: { type: "qr_scan", qrSource: source ?? envelope.qrSource ?? undefined } });
    },
    end: () => {
      rootEl.removeEventListener("click", onClick, { capture: true } as EventListenerOptions);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    },
  };
}

