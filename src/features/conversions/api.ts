/** Conversion goals CRUD + shared queries. */
import { supabase } from "@/integrations/supabase/client";

export type GoalType =
  | "whatsapp_click"
  | "phone_call"
  | "email_click"
  | "website_click"
  | "file_download"
  | "form_submit"
  | "booking_click"
  | "qr_scan"
  | "custom_url_click";

export interface MatchRules {
  urlContains?: string;
  urlEquals?: string;
  host?: string;
  blockType?: string;
  blockId?: string;
  qrSource?: string;
}

export interface Goal {
  id: string;
  workspace_id: string;
  bio_page_id: string | null;
  name: string;
  description: string | null;
  goal_type: GoalType;
  match_rules: MatchRules;
  enabled: boolean;
  target_value: number | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  whatsapp_click: "WhatsApp Click",
  phone_call: "Phone Call",
  email_click: "Email Click",
  website_click: "Website Click",
  file_download: "File Download",
  form_submit: "Contact Form Submit",
  booking_click: "Booking Click",
  qr_scan: "QR Scan",
  custom_url_click: "Custom URL Click",
};

/** Default match rule presets per goal type — used to prefill the form. */
export const GOAL_DEFAULT_RULES: Record<GoalType, MatchRules> = {
  whatsapp_click: { urlContains: "wa.me" },
  phone_call: { urlContains: "tel:" },
  email_click: { urlContains: "mailto:" },
  website_click: {},
  file_download: { blockType: "file" },
  form_submit: { blockType: "form" },
  booking_click: { urlContains: "calendly.com" },
  qr_scan: {},
  custom_url_click: {},
};

export async function listGoals(workspaceId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from("conversion_goals")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Goal[];
}

export interface UpsertGoalInput {
  id?: string;
  workspace_id: string;
  bio_page_id: string | null;
  name: string;
  description?: string | null;
  goal_type: GoalType;
  match_rules: MatchRules;
  enabled: boolean;
  target_value?: number | null;
  priority?: number;
}

export async function upsertGoal(input: UpsertGoalInput): Promise<Goal> {
  const payload = {
    workspace_id: input.workspace_id,
    bio_page_id: input.bio_page_id,
    name: input.name,
    description: input.description ?? null,
    goal_type: input.goal_type,
    match_rules: JSON.parse(JSON.stringify(input.match_rules ?? {})),
    enabled: input.enabled,
    target_value: input.target_value ?? null,
    priority: input.priority ?? 0,
  };
  const query = input.id
    ? supabase.from("conversion_goals").update(payload).eq("id", input.id).select().single()
    : supabase.from("conversion_goals").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Goal;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from("conversion_goals").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleGoal(id: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from("conversion_goals").update({ enabled }).eq("id", id);
  if (error) throw error;
}
