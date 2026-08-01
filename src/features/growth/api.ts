import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_GROWTH_SETTINGS,
  DEFAULT_PLAN_BRANDING,
  isBrandedPlan,
  isBrandingMode,
  type BrandingMode,
  type GrowthEngineSettings,
  type WorkspaceBranding,
} from "./types";

export async function fetchGrowthSettings(): Promise<GrowthEngineSettings> {
  const { data, error } = await supabase
    .from("growth_engine_settings" as never)
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return DEFAULT_GROWTH_SETTINGS;
  const row = data as unknown as Partial<GrowthEngineSettings>;
  return {
    ...DEFAULT_GROWTH_SETTINGS,
    ...row,
    plan_branding_defaults: {
      ...DEFAULT_PLAN_BRANDING,
      ...((row.plan_branding_defaults ?? {}) as Record<string, BrandingMode>),
    },
  };
}

export async function updateGrowthSettings(patch: Partial<GrowthEngineSettings>): Promise<void> {
  const { error } = await supabase
    .from("growth_engine_settings" as never)
    .update({ ...patch, updated_at: new Date().toISOString() } as never)
    .eq("id", "default");
  if (error) throw error;
}

export async function fetchWorkspacePlanCode(workspaceId: string): Promise<string> {
  const { data, error } = await supabase.rpc("public_workspace_plan", {
    _workspace_id: workspaceId,
  } as never);
  if (error || !data) return "udaan";
  return String(data);
}

/**
 * Resolved branding for a workspace: the workspace override when set,
 * otherwise the admin default for that plan. UDAAN/free is always "full".
 */
export async function fetchWorkspaceBranding(workspaceId: string): Promise<WorkspaceBranding> {
  const { data, error } = await supabase.rpc("public_workspace_branding" as never, {
    _workspace_id: workspaceId,
  } as never);
  if (error || !data) return { plan: "udaan", mode: "full", locked: true };
  const row = data as unknown as { plan?: string; mode?: string; locked?: boolean };
  const plan = row.plan ?? "udaan";
  const locked = row.locked ?? isBrandedPlan(plan);
  const mode: BrandingMode = locked ? "full" : isBrandingMode(row.mode) ? row.mode : "hidden";
  return { plan, mode, locked };
}

/** Save the workspace-level branding mode (paid plans only) and notify live pages. */
export async function updateWorkspaceBranding(
  workspaceId: string,
  mode: BrandingMode,
): Promise<void> {
  const { error } = await supabase
    .from("workspaces")
    .update({ branding_mode: mode } as never)
    .eq("id", workspaceId);
  if (error) throw error;
  await broadcastBrandingChange(workspaceId, mode);
}

const channelName = (workspaceId: string) => `branding:${workspaceId}`;

/** Push the new mode to any public page currently open for this workspace. */
export async function broadcastBrandingChange(
  workspaceId: string,
  mode: BrandingMode,
): Promise<void> {
  try {
    const ch = supabase.channel(channelName(workspaceId));
    await ch.subscribe();
    await ch.send({ type: "broadcast", event: "branding", payload: { mode } });
    await supabase.removeChannel(ch);
  } catch {
    // best-effort realtime — the next page load still picks up the change
  }
}

/** Live-update subscription used by the public bio renderer. */
export function subscribeBrandingChanges(
  workspaceId: string,
  onChange: (mode: BrandingMode) => void,
): () => void {
  const ch = supabase
    .channel(channelName(workspaceId))
    .on("broadcast", { event: "branding" }, (msg) => {
      const mode = (msg.payload as { mode?: unknown } | undefined)?.mode;
      if (isBrandingMode(mode)) onChange(mode);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}
