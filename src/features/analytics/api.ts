/**
 * Analytics query layer. All reads go through the browser Supabase client
 * (RLS restricts to workspace members). Aggregations are done in JS on
 * modest result sets — good enough for LS-09B, swap for RPC/materialized
 * views when workspaces cross ~100k events / range.
 */
import { supabase } from "@/integrations/supabase/client";

export type RangeKey = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
  key: RangeKey;
}

export function resolveRange(key: RangeKey, custom?: { from: Date; to: Date }): DateRange {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  switch (key) {
    case "today":
      return { from: start, to: end, key };
    case "yesterday": {
      const y = new Date(start);
      y.setDate(y.getDate() - 1);
      const ye = new Date(end);
      ye.setDate(ye.getDate() - 1);
      return { from: y, to: ye, key };
    }
    case "7d": {
      const f = new Date(start);
      f.setDate(f.getDate() - 6);
      return { from: f, to: end, key };
    }
    case "30d": {
      const f = new Date(start);
      f.setDate(f.getDate() - 29);
      return { from: f, to: end, key };
    }
    case "90d": {
      const f = new Date(start);
      f.setDate(f.getDate() - 89);
      return { from: f, to: end, key };
    }
    case "custom":
      if (!custom) return resolveRange("7d");
      return { from: custom.from, to: custom.to, key };
  }
}

export interface EventRow {
  id: number;
  event_type: "page_view" | "link_click" | "qr_scan" | "session_end";
  bio_page_id: string;
  session_id: string | null;
  visitor_hash: string;
  device_type: string;
  browser: string | null;
  os: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  referrer_source: string | null;
  referrer_host: string | null;
  link_url: string | null;
  link_host: string | null;
  block_id: string | null;
  block_type: string | null;
  qr_source: string | null;
  duration_ms: number | null;
  scroll_pct: number | null;
  created_at: string;
}

export interface SessionRow {
  id: string;
  bio_page_id: string;
  visitor_hash: string;
  is_returning: boolean;
  device_type: string;
  country: string | null;
  city: string | null;
  region: string | null;
  page_views: number;
  link_clicks: number;
  duration_ms: number;
  is_bounce: boolean;
  max_scroll_pct: number;
  engagement_score: number;
  entry_url: string | null;
  exit_url: string | null;
  referrer_source: string | null;
  last_seen_at: string;
  started_at: string;
}

export async function fetchEvents(workspaceId: string, range: DateRange): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select(
      "id,event_type,bio_page_id,session_id,visitor_hash,device_type,browser,os,country,region,city,referrer_source,referrer_host,link_url,link_host,block_id,qr_source,duration_ms,created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("is_bot", false)
    .gte("created_at", range.from.toISOString())
    .lte("created_at", range.to.toISOString())
    .order("created_at", { ascending: false })
    .limit(20000);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function fetchSessions(workspaceId: string, range: DateRange): Promise<SessionRow[]> {
  const { data, error } = await supabase
    .from("analytics_sessions")
    .select(
      "id,bio_page_id,visitor_hash,is_returning,device_type,country,region,city,page_views,link_clicks,last_seen_at,started_at",
    )
    .eq("workspace_id", workspaceId)
    .gte("started_at", range.from.toISOString())
    .lte("started_at", range.to.toISOString())
    .order("started_at", { ascending: false })
    .limit(20000);
  if (error) throw error;
  return (data ?? []) as SessionRow[];
}

/** Active visitors in the last 5 minutes (based on session last_seen_at). */
export async function fetchActiveVisitors(workspaceId: string): Promise<SessionRow[]> {
  const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("analytics_sessions")
    .select(
      "id,bio_page_id,visitor_hash,is_returning,device_type,country,region,city,page_views,link_clicks,last_seen_at,started_at",
    )
    .eq("workspace_id", workspaceId)
    .gte("last_seen_at", since)
    .order("last_seen_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as SessionRow[];
}

export async function fetchRecentEvents(workspaceId: string, limit = 20): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("analytics_events")
    .select(
      "id,event_type,bio_page_id,session_id,visitor_hash,device_type,browser,os,country,region,city,referrer_source,referrer_host,link_url,link_host,block_id,qr_source,duration_ms,created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("is_bot", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export interface PageMeta {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export async function fetchWorkspacePages(workspaceId: string): Promise<PageMeta[]> {
  const { data, error } = await supabase
    .from("bio_pages")
    .select("id,name,slug,status")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []) as PageMeta[];
}
