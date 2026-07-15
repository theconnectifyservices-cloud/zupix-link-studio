import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_TRACKING, type TrackingSettings } from "./types";
import { validators } from "./validation";

export async function fetchTrackingSettings(workspaceId: string): Promise<TrackingSettings> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("tracking_settings")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  const raw = (data as { tracking_settings?: unknown } | null)?.tracking_settings;
  return { ...DEFAULT_TRACKING, ...(raw as TrackingSettings | undefined) };
}

export async function updateTrackingSettings(
  workspaceId: string,
  next: TrackingSettings,
): Promise<void> {
  const { error } = await supabase
    .from("workspaces")
    .update({ tracking_settings: next as unknown as never })
    .eq("id", workspaceId);
  if (error) throw error;
}

/** Fetch tracking config for a public bio page via SECURITY DEFINER RPC. */
export async function fetchPublicTracking(workspaceId: string): Promise<TrackingSettings> {
  const { data, error } = await supabase.rpc("get_public_tracking", {
    _workspace_id: workspaceId,
  });
  if (error) return DEFAULT_TRACKING;
  const raw = data as unknown as TrackingSettings | null;
  return { ...DEFAULT_TRACKING, ...(raw ?? {}) };
}

/**
 * "Connection test" for pixel/tag integrations: because these providers
 * don't expose an anonymous validation endpoint, we do two checks:
 *  1) Format validation.
 *  2) Best-effort reachability of the loader script (opaque no-cors probe).
 * Result is stored back onto the integration so the health card can render it.
 */
export interface TestResult {
  status: "connected" | "invalid" | "warning" | "disconnected";
  message: string;
  checkedAt: string;
}

export async function testConnection(
  kind: "ga4" | "gtm" | "metaPixel" | "clarity" | "linkedIn" | "tiktok",
  id: string,
): Promise<TestResult> {
  const now = new Date().toISOString();
  const format =
    kind === "ga4" ? validators.ga4(id)
    : kind === "gtm" ? validators.gtm(id)
    : kind === "metaPixel" ? validators.metaPixel(id)
    : kind === "clarity" ? validators.clarity(id)
    : kind === "linkedIn" ? validators.linkedIn(id)
    : validators.tiktok(id);
  if (!format.ok) return { status: "invalid", message: format.message ?? "Invalid ID", checkedAt: now };

  const url = loaderUrlFor(kind, id.trim());
  try {
    // no-cors probe — we can't read the response, but a network failure
    // (DNS, blocked) throws. Success = reachable.
    await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store" });
    return { status: "connected", message: "Loader script reachable", checkedAt: now };
  } catch {
    return {
      status: "warning",
      message: "Format looks valid but the loader wasn't reachable from this browser",
      checkedAt: now,
    };
  }
}

function loaderUrlFor(kind: string, id: string): string {
  switch (kind) {
    case "ga4":
      return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    case "gtm":
      return `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
    case "metaPixel":
      return "https://connect.facebook.net/en_US/fbevents.js";
    case "clarity":
      return `https://www.clarity.ms/tag/${encodeURIComponent(id)}`;
    case "linkedIn":
      return "https://snap.licdn.com/li.lms-analytics/insight.min.js";
    case "tiktok":
      return "https://analytics.tiktok.com/i18n/pixel/events.js";
    default:
      return "https://example.invalid";
  }
}
