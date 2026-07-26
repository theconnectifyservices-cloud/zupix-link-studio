import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_GROWTH_SETTINGS, type GrowthEngineSettings } from "./types";

export async function fetchGrowthSettings(): Promise<GrowthEngineSettings> {
  const { data, error } = await supabase
    .from("growth_engine_settings" as never)
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error || !data) return DEFAULT_GROWTH_SETTINGS;
  return { ...DEFAULT_GROWTH_SETTINGS, ...(data as unknown as GrowthEngineSettings) };
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
