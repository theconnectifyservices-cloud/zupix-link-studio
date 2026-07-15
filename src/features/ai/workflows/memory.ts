/**
 * LS-12E — Workspace AI Memory API.
 *
 * Wraps `public.ai_workspace_memory`. RLS ensures cross-workspace isolation
 * — this module only adds the workspace_id filter so queries stay narrow.
 */
import { supabase } from "@/integrations/supabase/client";

export interface WorkspaceMemory {
  workspace_id: string;
  brand_voice: string | null;
  preferred_tone: string | null;
  target_audience: string | null;
  content_preferences: Record<string, unknown>;
  design_preferences: Record<string, unknown>;
  notes: string | null;
  updated_at?: string;
}

export async function loadWorkspaceMemory(workspaceId: string): Promise<WorkspaceMemory | null> {
  const { data, error } = await supabase
    .from("ai_workspace_memory")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return (data as WorkspaceMemory | null) ?? null;
}

export async function saveWorkspaceMemory(
  workspaceId: string,
  userId: string,
  patch: Partial<Omit<WorkspaceMemory, "workspace_id" | "updated_at">>,
): Promise<WorkspaceMemory> {
  const { data, error } = await supabase
    .from("ai_workspace_memory")
    .upsert(
      {
        workspace_id: workspaceId,
        updated_by: userId,
        ...patch,
      },
      { onConflict: "workspace_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as WorkspaceMemory;
}
