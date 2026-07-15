/** Shared analytics tracking types (client + server). */

export type AnalyticsEventType = "page_view" | "link_click" | "qr_scan" | "session_end";
export type DeviceType = "mobile" | "tablet" | "desktop" | "bot" | "unknown";

export interface ClientEnvelope {
  pageId: string;
  slug: string;
  sessionKey: string;
  sessionStartedAt: number;
  isReturning: boolean;
  visitorId: string;
  device: {
    type: DeviceType;
    browser: string;
    os: string;
    screen: string;
    dpr: number;
  };
  referrer: string | null;
  utm: {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
  };
  timezone: string | null;
  qrSource: string | null;
  /** Full landing URL (path + query, no origin). */
  entryUrl?: string | null;
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
        scrollPct?: number;
      }
    | { type: "qr_scan"; qrSource?: string }
    | {
        type: "session_end";
        durationMs: number;
        pageViews: number;
        linkClicks: number;
        maxScrollPct?: number;
        exitUrl?: string | null;
      };
}
