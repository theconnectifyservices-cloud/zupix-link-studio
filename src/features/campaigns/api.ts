/** Campaigns CRUD + attribution reads. All queries are workspace-scoped via RLS. */
import { supabase } from "@/integrations/supabase/client";

export type CampaignStatus = "draft" | "active" | "paused" | "completed" | "archived";

export interface Campaign {
  id: string;
  workspace_id: string;
  bio_page_id: string | null;
  name: string;
  description: string | null;
  status: CampaignStatus;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string | null;
  utm_content: string | null;
  target_url: string;
  short_code: string | null;
  notes: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  archived: "Archived",
};

export async function listCampaigns(workspaceId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Campaign[];
}

export interface UpsertCampaignInput {
  id?: string;
  workspace_id: string;
  bio_page_id: string | null;
  name: string;
  description?: string | null;
  status: CampaignStatus;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term?: string | null;
  utm_content?: string | null;
  target_url: string;
  short_code?: string | null;
  notes?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
}

export async function upsertCampaign(input: UpsertCampaignInput): Promise<Campaign> {
  const payload = {
    workspace_id: input.workspace_id,
    bio_page_id: input.bio_page_id,
    name: input.name,
    description: input.description ?? null,
    status: input.status,
    utm_source: input.utm_source,
    utm_medium: input.utm_medium,
    utm_campaign: input.utm_campaign,
    utm_term: input.utm_term ?? null,
    utm_content: input.utm_content ?? null,
    target_url: input.target_url,
    short_code: input.short_code ?? null,
    notes: input.notes ?? null,
    starts_at: input.starts_at ?? null,
    ends_at: input.ends_at ?? null,
  };
  const query = input.id
    ? supabase.from("campaigns").update(payload).eq("id", input.id).select().single()
    : supabase.from("campaigns").insert(payload).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as Campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}

export async function updateCampaignStatus(id: string, status: CampaignStatus): Promise<void> {
  const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Attribution rows fetched from analytics_sessions (UTM + campaign_id + counters). */
export interface AttrSession {
  id: string;
  visitor_hash: string;
  bio_page_id: string;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer_source: string | null;
  qr_source: string | null;
  page_views: number;
  link_clicks: number;
  duration_ms: number;
  is_bounce: boolean;
  engagement_score: number;
  started_at: string;
  last_seen_at: string;
}

export interface AttrEvent {
  id: number;
  event_type: "page_view" | "link_click" | "qr_scan" | "session_end";
  visitor_hash: string;
  bio_page_id: string;
  campaign_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  referrer_source: string | null;
  link_url: string | null;
  link_host: string | null;
  qr_source: string | null;
  created_at: string;
}

export async function fetchAttrSessions(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<AttrSession[]> {
  const { data, error } = await supabase
    .from("analytics_sessions")
    .select(
      "id,visitor_hash,bio_page_id,campaign_id,utm_source,utm_medium,utm_campaign,utm_term,utm_content,referrer_source,qr_source,page_views,link_clicks,duration_ms,is_bounce,engagement_score,started_at,last_seen_at",
    )
    .eq("workspace_id", workspaceId)
    .gte("started_at", from.toISOString())
    .lte("started_at", to.toISOString())
    .order("started_at", { ascending: true })
    .limit(20000);
  if (error) throw error;
  return (data ?? []) as unknown as AttrSession[];
}

export async function fetchAttrEvents(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<AttrEvent[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select(
      "id,event_type,visitor_hash,bio_page_id,campaign_id,utm_source,utm_medium,utm_campaign,utm_term,utm_content,referrer_source,link_url,link_host,qr_source,created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("is_bot", false)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true })
    .limit(20000);
  if (error) throw error;
  return (data ?? []) as unknown as AttrEvent[];
}
