import { supabase } from "@/integrations/supabase/client";
import type { AiConversation, AiMessage, AiPrompt, AiActivity, AiRole } from "./types";

// ── Conversations ──────────────────────────────────────────────────
export async function listConversations(workspaceId: string, includeArchived = false) {
  let q = supabase
    .from("ai_conversations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });
  if (!includeArchived) q = q.eq("archived", false);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AiConversation[];
}

export async function createConversation(input: {
  workspaceId: string;
  userId: string;
  title?: string;
  model?: string;
}) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      title: input.title ?? "New conversation",
      model: input.model ?? "google/gemini-3-flash-preview",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AiConversation;
}

export async function updateConversation(
  id: string,
  patch: Partial<Pick<AiConversation, "title" | "pinned" | "archived" | "model">>,
) {
  const { error } = await supabase.from("ai_conversations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
  if (error) throw error;
}

// ── Messages ───────────────────────────────────────────────────────
export async function listMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AiMessage[];
}

export async function insertMessage(input: {
  conversationId: string;
  role: AiRole;
  content: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
}) {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      model: input.model ?? null,
      tokens_in: input.tokensIn ?? null,
      tokens_out: input.tokensOut ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  await supabase
    .from("ai_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", input.conversationId);
  return data as AiMessage;
}

export async function deleteMessage(id: string) {
  const { error } = await supabase.from("ai_messages").delete().eq("id", id);
  if (error) throw error;
}

// ── Prompts ────────────────────────────────────────────────────────
export async function listPrompts(workspaceId: string) {
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("favorite", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AiPrompt[];
}

export async function createPrompt(input: {
  workspaceId: string;
  userId: string;
  title: string;
  body: string;
  category?: string;
}) {
  const { data, error } = await supabase
    .from("ai_prompts")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      title: input.title,
      body: input.body,
      category: input.category ?? "general",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AiPrompt;
}

export async function updatePrompt(id: string, patch: Partial<AiPrompt>) {
  const { error } = await supabase.from("ai_prompts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deletePrompt(id: string) {
  const { error } = await supabase.from("ai_prompts").delete().eq("id", id);
  if (error) throw error;
}

export async function bumpPromptUsage(id: string, currentCount: number) {
  await supabase
    .from("ai_prompts")
    .update({ use_count: currentCount + 1, last_used_at: new Date().toISOString() })
    .eq("id", id);
}

// ── Activity ───────────────────────────────────────────────────────
export async function listActivity(workspaceId: string, limit = 50) {
  const { data, error } = await supabase
    .from("ai_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AiActivity[];
}

export async function logActivity(input: {
  workspaceId: string;
  userId: string;
  kind: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  await supabase.from("ai_activity").insert({
    workspace_id: input.workspaceId,
    user_id: input.userId,
    kind: input.kind,
    summary: input.summary,
    metadata: (input.metadata ?? {}) as never,
  });
}
