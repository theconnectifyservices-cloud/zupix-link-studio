/**
 * Client-side submit helpers for the Business Tools blocks.
 *
 * Both endpoints live under `/api/public/` because visitors are anonymous.
 * The server validates the target page and writes with the service role, so
 * no anon insert policy is needed on `bio_leads` / `bio_bookings`.
 */
import { getTracker } from "@/features/analytics/tracker";

export interface LeadAttachment {
  name: string;
  type: string;
  size: number;
  /** base64 (no data-url prefix) */
  data: string;
}

export interface LeadPayload {
  pageId: string;
  slug: string;
  blockId: string;
  formName: string;
  values: Record<string, string | string[] | boolean>;
  /** Honeypot — must stay empty; bots fill it. */
  hp?: string;
  /** ms between form render and submit; sub-second submits are bots. */
  elapsedMs?: number;
  pageUrl?: string;
  attachments?: LeadAttachment[];
}


export interface BookingPayload {
  pageId: string;
  slug: string;
  blockId: string;
  serviceTitle: string;
  bookingKind: string;
  customerName: string;
  email?: string;
  phone?: string;
  notes?: string;
  date: string;
  time: string;
  durationMin: number;
  timezone?: string;
  locationType: string;
  meetingLink?: string;
  address?: string;
}

async function post(url: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function submitLead(payload: LeadPayload) {
  return post("/api/public/leads", payload);
}

export function submitBooking(payload: BookingPayload) {
  return post("/api/public/bookings", payload);
}

/**
 * Records a business interaction in the existing analytics pipeline.
 * Non-anchor interactions (form submit, booking request, UPI reveal) have no
 * href for the delegated click listener to pick up, so they go through the
 * tracker handle with a synthetic `zx://` url.
 */
export function trackBusiness(
  action:
    | "product_click"
    | "buy_now_click"
    | "payment_link_click"
    | "whatsapp_order"
    | "booking_request"
    | "form_submit",
  opts: { blockId: string; blockType: string; label?: string },
) {
  getTracker()?.trackClick({
    blockId: opts.blockId,
    blockType: opts.blockType,
    linkUrl: `zx://${action}${opts.label ? `/${encodeURIComponent(opts.label.slice(0, 60))}` : ""}`,
    clickSource: action,
  });
}
