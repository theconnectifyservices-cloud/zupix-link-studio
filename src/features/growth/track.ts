/** Lightweight branding analytics — writes to analytics_events (RLS: anon insert allowed via public policy). */
import { supabase } from "@/integrations/supabase/client";

export type GrowthEvent =
  | "branding_view"
  | "branding_click"
  | "footer_cta_click"
  | "upgrade_click"
  | "referral_click"
  | "qr_scan"
  | "share_click";

export async function trackGrowthEvent(
  event: GrowthEvent,
  meta: Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from("analytics_events" as never).insert({
      event_type: `growth.${event}`,
      properties: meta,
    } as never);
  } catch {
    // best-effort — never break the page
  }
}
