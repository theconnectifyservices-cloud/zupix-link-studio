/**
 * App Update Center data access.
 * Everything goes through the authenticated browser client so RLS decides
 * who may publish and who may only read their own targeted updates.
 */
import { supabase } from "@/integrations/supabase/client";
import type { MyVersion, PlatformVersion, SkipOverview, UpdateAnalytics } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ------------------------------ user side ------------------------------ */

/** Every live version targeted at the current user, newest first. */
export async function fetchMyVersions(): Promise<MyVersion[]> {
  const { data, error } = await db.rpc("platform_my_versions");
  if (error) throw error;
  return (data ?? []) as MyVersion[];
}

export interface UpdateStatePatch {
  seen?: boolean;
  read?: boolean;
  dismissed?: boolean;
  neverShow?: boolean;
  updated?: boolean;
  /** true = skip this version forever, false = restore it. */
  skipped?: boolean;
}

export async function setUpdateState(versionId: string, patch: UpdateStatePatch) {
  const { error } = await db.rpc("platform_set_update_state", {
    _version_id: versionId,
    _seen: patch.seen ?? null,
    _read: patch.read ?? null,
    _dismissed: patch.dismissed ?? null,
    _never_show: patch.neverShow ?? null,
    _updated: patch.updated ?? null,
    _skipped: patch.skipped ?? null,
  });
  if (error) throw error;
}

/** Personal interaction history for the "Update History" list. */
export async function fetchMyUpdateHistory(limit = 50) {
  const { data, error } = await db
    .from("platform_update_events")
    .select("id, version, event_type, channel, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as Array<{
    id: string;
    version: string | null;
    event_type: string;
    channel: string;
    created_at: string;
  }>;
}

/* ------------------------------ admin side ------------------------------ */

export async function adminListVersions(): Promise<PlatformVersion[]> {
  const { data, error } = await db
    .from("platform_versions")
    .select("*")
    .order("version_sort", { ascending: false })
    .order("release_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PlatformVersion[];
}

export type VersionDraft = Partial<PlatformVersion> & { version: string; title: string };

export async function adminSaveVersion(draft: VersionDraft): Promise<PlatformVersion> {
  const { id, version_sort: _vs, created_at: _c, updated_at: _u, ...rest } = draft as Record<
    string,
    unknown
  > & { id?: string };

  if (id) {
    const { data, error } = await db
      .from("platform_versions")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as PlatformVersion;
  }

  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await db
    .from("platform_versions")
    .insert({ ...rest, created_by: auth.user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as PlatformVersion;
}

export async function adminDeleteVersion(id: string) {
  const { error } = await db.from("platform_versions").delete().eq("id", id);
  if (error) throw error;
}

/** Publish now, schedule, archive or send back to draft. */
export async function adminSetVersionStatus(
  id: string,
  status: PlatformVersion["status"],
  publishAt?: string | null,
) {
  const patch: Record<string, unknown> = { status };
  if (status === "scheduled") patch.publish_at = publishAt ?? null;
  if (status === "published") patch.publish_at = null;
  const { error } = await db.from("platform_versions").update(patch).eq("id", id);
  if (error) throw error;
}

/** Platform-wide skip metrics (admin only). */
export async function adminFetchSkipOverview(): Promise<SkipOverview> {
  const { data, error } = await db.rpc("platform_skip_overview");
  if (error) throw error;
  return data as SkipOverview;
}

export async function adminFetchAnalytics(versionId: string): Promise<UpdateAnalytics> {
  const { data, error } = await db.rpc("platform_update_analytics", { _version_id: versionId });
  if (error) throw error;
  return data as UpdateAnalytics;
}
