import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "@/features/builder/types";

export type PublishStatus = "draft" | "published" | "scheduled" | "archived" | "unpublished";
export type PublishVisibility = "public" | "private" | "unlisted" | "password";
export type PublishAction =
  | "published"
  | "updated"
  | "restored"
  | "unpublished"
  | "archived"
  | "scheduled"
  | "scheduled_cancelled";

export interface PublishState {
  id: string;
  workspace_id: string;
  slug: string;
  status: PublishStatus;
  visibility: PublishVisibility;
  content: BioContent;
  published_content: BioContent | null;
  published_at: string | null;
  published_version_id: string | null;
  scheduled_publish_at: string | null;
  scheduled_unpublish_at: string | null;
  has_password: boolean;
  updated_at: string;
  last_saved_at: string | null;
}

export interface PageVersion {
  id: string;
  page_id: string;
  workspace_id: string;
  created_by: string | null;
  label: string;
  notes: string | null;
  is_publish: boolean;
  created_at: string;
}

export interface PageVersionFull extends PageVersion {
  content: BioContent;
}

export interface PublishEvent {
  id: string;
  page_id: string;
  actor_id: string | null;
  action: PublishAction;
  version_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

const PAGES = "bio_pages" as never;
const VERSIONS = "bio_page_versions" as never;
const EVENTS = "bio_page_publish_events" as never;

export async function fetchPublishState(pageId: string): Promise<PublishState> {
  const { data, error } = await supabase
    .from(PAGES)
    .select(
      "id,workspace_id,slug,status,visibility,content,published_content,published_at,published_version_id,scheduled_publish_at,scheduled_unpublish_at,password_hash,updated_at,last_saved_at",
    )
    .eq("id", pageId)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  const row = data as unknown as Omit<PublishState, "has_password"> & {
    password_hash: string | null;
  };
  return { ...row, has_password: !!row.password_hash };
}

export async function listVersions(pageId: string): Promise<PageVersion[]> {
  const { data, error } = await supabase
    .from(VERSIONS)
    .select("id,page_id,workspace_id,created_by,label,notes,is_publish,created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as PageVersion[]) ?? [];
}

export async function fetchVersionContent(versionId: string): Promise<PageVersionFull> {
  const { data, error } = await supabase
    .from(VERSIONS)
    .select("id,page_id,workspace_id,created_by,label,notes,is_publish,created_at,content")
    .eq("id", versionId)
    .single();
  if (error) throw error;
  return data as unknown as PageVersionFull;
}

export async function listPublishEvents(pageId: string): Promise<PublishEvent[]> {
  const { data, error } = await supabase
    .from(EVENTS)
    .select("id,page_id,actor_id,action,version_id,meta,created_at")
    .eq("page_id", pageId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as PublishEvent[]) ?? [];
}

interface CreateVersionInput {
  pageId: string;
  workspaceId: string;
  content: BioContent;
  label?: string;
  notes?: string;
  isPublish?: boolean;
}
async function createVersion(input: CreateVersionInput): Promise<PageVersion> {
  const { data, error } = await supabase
    .from(VERSIONS)
    .insert({
      page_id: input.pageId,
      workspace_id: input.workspaceId,
      content: input.content,
      label: input.label ?? (input.isPublish ? "Published" : "Snapshot"),
      notes: input.notes ?? null,
      is_publish: !!input.isPublish,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    } as never)
    .select("id,page_id,workspace_id,created_by,label,notes,is_publish,created_at")
    .single();
  if (error) throw error;
  return data as unknown as PageVersion;
}

async function logEvent(
  pageId: string,
  workspaceId: string,
  action: PublishAction,
  versionId?: string | null,
  meta?: Record<string, unknown>,
) {
  const actorId = (await supabase.auth.getUser()).data.user?.id ?? null;
  await supabase.from(EVENTS).insert({
    page_id: pageId,
    workspace_id: workspaceId,
    actor_id: actorId,
    action,
    version_id: versionId ?? null,
    meta: meta ?? {},
  } as never);
}

export interface PublishOptions {
  content: BioContent;
  note?: string;
}

/**
 * Publish the current draft: snapshot as a version, copy content to
 * `published_content`, mark status='published', and record the event.
 * The public renderer reads `published_content` so drafts never leak.
 */
export async function publishPage(pageId: string, opts: PublishOptions) {
  const state = await fetchPublishState(pageId);
  const isFirst = !state.published_at;
  const version = await createVersion({
    pageId,
    workspaceId: state.workspace_id,
    content: opts.content,
    label: isFirst ? "Initial publish" : "Publish update",
    notes: opts.note,
    isPublish: true,
  });
  const now = new Date().toISOString();
  const { error } = await supabase
    .from(PAGES)
    .update({
      published_content: opts.content,
      published_at: now,
      published_version_id: version.id,
      status: "published",
      scheduled_publish_at: null,
    } as never)
    .eq("id", pageId);
  if (error) throw error;
  await logEvent(pageId, state.workspace_id, isFirst ? "published" : "updated", version.id, {
    note: opts.note ?? null,
  });
  return version;
}

export async function unpublishPage(pageId: string) {
  const state = await fetchPublishState(pageId);
  const { error } = await supabase
    .from(PAGES)
    .update({ status: "unpublished" } as never)
    .eq("id", pageId);
  if (error) throw error;
  await logEvent(pageId, state.workspace_id, "unpublished");
}

export async function archivePage(pageId: string) {
  const state = await fetchPublishState(pageId);
  const { error } = await supabase
    .from(PAGES)
    .update({ status: "archived", archived_at: new Date().toISOString() } as never)
    .eq("id", pageId);
  if (error) throw error;
  await logEvent(pageId, state.workspace_id, "archived");
}

export interface ScheduleInput {
  publishAt?: string | null;
  unpublishAt?: string | null;
}
export async function schedulePage(pageId: string, input: ScheduleInput) {
  const state = await fetchPublishState(pageId);
  const patch: Record<string, unknown> = {
    scheduled_publish_at: input.publishAt ?? null,
    scheduled_unpublish_at: input.unpublishAt ?? null,
  };
  if (input.publishAt) patch.status = "scheduled";
  const { error } = await supabase
    .from(PAGES)
    .update(patch as never)
    .eq("id", pageId);
  if (error) throw error;
  await logEvent(
    pageId,
    state.workspace_id,
    input.publishAt ? "scheduled" : "scheduled_cancelled",
    null,
    input,
  );
}

export async function updateVisibility(
  pageId: string,
  visibility: PublishVisibility,
  passwordHash?: string | null,
) {
  const patch: Record<string, unknown> = { visibility };
  if (visibility === "password" && passwordHash) patch.password_hash = passwordHash;
  if (visibility !== "password") patch.password_hash = null;
  const { error } = await supabase
    .from(PAGES)
    .update(patch as never)
    .eq("id", pageId);
  if (error) throw error;
}

/**
 * Restore a version: copies its content back into the draft. Does not
 * automatically republish — the user reviews and re-publishes explicitly.
 */
export async function restoreVersion(pageId: string, versionId: string): Promise<BioContent> {
  const state = await fetchPublishState(pageId);
  const v = await fetchVersionContent(versionId);
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from(PAGES)
    .update({ content: v.content, last_saved_at: nowIso } as never)
    .eq("id", pageId);
  if (error) throw error;
  await logEvent(pageId, state.workspace_id, "restored", versionId);
  return v.content;
}

export async function snapshotVersion(
  pageId: string,
  content: BioContent,
  label?: string,
  notes?: string,
): Promise<PageVersion> {
  const state = await fetchPublishState(pageId);
  return createVersion({
    pageId,
    workspaceId: state.workspace_id,
    content,
    label,
    notes,
    isPublish: false,
  });
}

/** Diff two versions at the block level for the compare UI. */
export interface VersionDiff {
  addedIds: string[];
  removedIds: string[];
  changedIds: string[];
  themeChanged: boolean;
}
export function diffContent(a: BioContent, b: BioContent): VersionDiff {
  const aMap = new Map(a.blocks.map((x) => [x.id, x]));
  const bMap = new Map(b.blocks.map((x) => [x.id, x]));
  const addedIds: string[] = [];
  const removedIds: string[] = [];
  const changedIds: string[] = [];
  for (const [id, block] of bMap) {
    if (!aMap.has(id)) addedIds.push(id);
    else if (JSON.stringify(aMap.get(id)) !== JSON.stringify(block)) changedIds.push(id);
  }
  for (const id of aMap.keys()) if (!bMap.has(id)) removedIds.push(id);
  const themeChanged = JSON.stringify(a.theme ?? null) !== JSON.stringify(b.theme ?? null);
  return { addedIds, removedIds, changedIds, themeChanged };
}

/** Non-cryptographic hash used only as an obfuscator for a shared password.
 *  Password-gated pages are an architecture placeholder; a proper KDF + edge
 *  verification will land alongside the gate UI in a later phase. */
export async function hashPassword(pwd: string): Promise<string> {
  const bytes = new TextEncoder().encode(pwd);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
