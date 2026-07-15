/**
 * Content Studio client API (LS-12B).
 * Handles generation requests + history persistence via ai_activity.
 */
import { supabase } from "@/integrations/supabase/client";
import type { AiActivity } from "../types";

export interface GenerateInput {
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
}

export async function generateContent(input: GenerateInput): Promise<string> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Generation failed (${res.status})`);
  }
  const json = (await res.json()) as { content: string };
  return json.content ?? "";
}

export interface HistoryEntry {
  workspaceId: string;
  userId: string;
  generatorId: string;
  category: string;
  inputs: Record<string, string>;
  output: string;
  favorite?: boolean;
}

export async function saveHistory(entry: HistoryEntry): Promise<AiActivity> {
  const { data, error } = await supabase
    .from("ai_activity")
    .insert({
      workspace_id: entry.workspaceId,
      user_id: entry.userId,
      kind: "content_generation",
      summary: `${entry.generatorId}: ${entry.output.slice(0, 120)}`,
      metadata: {
        generator: entry.generatorId,
        category: entry.category,
        inputs: entry.inputs,
        output: entry.output,
        favorite: entry.favorite ?? false,
      },
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AiActivity;
}

export async function listHistory(workspaceId: string): Promise<AiActivity[]> {
  const { data, error } = await supabase
    .from("ai_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("kind", "content_generation")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as AiActivity[];
}

export async function toggleFavorite(id: string, favorite: boolean, current: Record<string, unknown>) {
  const { error } = await supabase
    .from("ai_activity")
    .update({ metadata: { ...current, favorite } })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteHistory(id: string) {
  const { error } = await supabase.from("ai_activity").delete().eq("id", id);
  if (error) throw error;
}
