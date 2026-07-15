/** Shared analytics tracking types (client + server). */

export type AnalyticsEventType = "page_view" | "link_click" | "qr_scan" | "session_end";
export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export interface ClientEnvelope {
  /** Bio page (server validates against slug). */
  pageId: string;
  slug: string;
  /** Stable per-tab session id (uuid), generated client-side. */
  sessionKey: string;
  /** Monotonic session start time (client ms). */
  sessionStartedAt: number;
  /** True when the visitor id existed before this session (returning). */
  isReturning: boolean;
  /** Visitor id (uuid) — persisted in localStorage; server also hashes IP+UA as backup. */
  visitorId: string;
  device: {
    type: DeviceType;
    browser: string;
    os: string;
    screen: string; // "1440x900"
    dpr: number;
  };
  /** Raw referrer captured on landing. */
  referrer: string | null;
  utm: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  /** Visitor-provided timezone (Intl). Country/region/city come from the edge. */
  timezone: string | null;
  /** Optional QR source: ?qr=<label>. */
  qrSource: string | null;
}

export interface TrackEventInput {
  envelope: ClientEnvelope;
  event:
    | { type: "page_view" }
    | {
        type: "link_click";
        blockId?: string;
        blockType?: string;
        linkUrl: string;
        clickSource?: string;
      }
    | { type: "qr_scan"; qrSource?: string }
    | { type: "session_end"; durationMs: number; pageViews: number; linkClicks: number };
}
