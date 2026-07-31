/**
 * Communication Center data access.
 * All calls go through the authenticated browser client, so RLS decides what
 * an admin may write and what a normal user may read.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  AnnouncementBar,
  CommNotification,
  FeedNotification,
  ReleaseNote,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ------------------------------ user feed ------------------------------ */

export async function fetchMyNotifications(): Promise<FeedNotification[]> {
  const { data, error } = await db.rpc("comm_my_notifications");
  if (error) throw error;
  return (data ?? []) as FeedNotification[];
}

export async function setNotificationState(
  id: string,
  state: { read?: boolean; popupSeen?: boolean; deleted?: boolean },
) {
  const { error } = await db.rpc("comm_set_notification_state", {
    _notification_id: id,
    _read: state.read ?? null,
    _popup_seen: state.popupSeen ?? null,
    _deleted: state.deleted ?? null,
  });
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await db.rpc("comm_mark_all_read");
  if (error) throw error;
}

/* --------------------------- admin: notifications --------------------------- */

export async function adminListNotifications(): Promise<CommNotification[]> {
  const { data, error } = await db
    .from("comm_notifications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CommNotification[];
}

export type NotificationInput = Partial<CommNotification> & { title: string };

export async function saveNotification(input: NotificationInput) {
  const payload = {
    title: input.title.trim(),
    description: input.description ?? "",
    type: input.type ?? "information",
    banner_image_url: input.banner_image_url || null,
    button_text: input.button_text || null,
    button_url: input.button_url || null,
    priority: input.priority ?? "normal",
    audience: input.audience ?? "all",
    target_user_ids: input.audience === "selected" ? (input.target_user_ids ?? []) : [],
    starts_at: input.starts_at ?? new Date().toISOString(),
    ends_at: input.ends_at || null,
    status: input.status ?? "draft",
  };

  if (input.id) {
    const { error } = await db.from("comm_notifications").update(payload).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data: session } = await supabase.auth.getUser();
  const { data, error } = await db
    .from("comm_notifications")
    .insert({ ...payload, created_by: session.user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteNotification(id: string) {
  const { error } = await db.from("comm_notifications").delete().eq("id", id);
  if (error) throw error;
}

/** Lightweight user picker source for the "Selected Users" audience. */
export async function searchUsers(term: string) {
  let q = db
    .from("profiles")
    .select("id, display_name, email")
    .is("deleted_at", null)
    .limit(20);
  const t = term.trim();
  if (t) q = q.or(`display_name.ilike.%${t}%,email.ilike.%${t}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as { id: string; display_name: string | null; email: string | null }[];
}

/* --------------------------- announcement bar --------------------------- */

export async function fetchActiveAnnouncement(): Promise<AnnouncementBar | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from("comm_announcement_bars")
    .select("*")
    .eq("is_enabled", true)
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data as AnnouncementBar) ?? null;
}

export async function adminListAnnouncements(): Promise<AnnouncementBar[]> {
  const { data, error } = await db
    .from("comm_announcement_bars")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AnnouncementBar[];
}

export type AnnouncementInput = Partial<AnnouncementBar> & { message: string };

export async function saveAnnouncement(input: AnnouncementInput) {
  const payload = {
    message: input.message.trim(),
    mode: input.mode ?? "static",
    button_text: input.button_text || null,
    button_url: input.button_url || null,
    background_color: input.background_color ?? "#111827",
    text_color: input.text_color ?? "#FFFFFF",
    is_enabled: input.is_enabled ?? false,
    starts_at: input.starts_at ?? new Date().toISOString(),
    ends_at: input.ends_at || null,
  };

  // Only one announcement may be enabled at a time (DB enforces it too).
  if (payload.is_enabled) await disableAllAnnouncements(input.id);

  if (input.id) {
    const { error } = await db.from("comm_announcement_bars").update(payload).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data: session } = await supabase.auth.getUser();
  const { data, error } = await db
    .from("comm_announcement_bars")
    .insert({ ...payload, created_by: session.user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function disableAllAnnouncements(exceptId?: string) {
  let q = db.from("comm_announcement_bars").update({ is_enabled: false }).eq("is_enabled", true);
  if (exceptId) q = q.neq("id", exceptId);
  const { error } = await q;
  if (error) throw error;
}

export async function setAnnouncementEnabled(id: string, enabled: boolean) {
  if (enabled) await disableAllAnnouncements(id);
  const { error } = await db
    .from("comm_announcement_bars")
    .update({ is_enabled: enabled })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await db.from("comm_announcement_bars").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------ release notes ------------------------------ */

export async function fetchReleaseNotes(publishedOnly = true): Promise<ReleaseNote[]> {
  let q = db.from("comm_release_notes").select("*").order("release_date", { ascending: false });
  if (publishedOnly) q = q.eq("status", "published");
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ReleaseNote[];
}

export type ReleaseNoteInput = Partial<ReleaseNote> & { version: string; title: string };

export async function saveReleaseNote(input: ReleaseNoteInput) {
  const payload = {
    version: input.version.trim(),
    title: input.title.trim(),
    description: input.description ?? "",
    release_date: input.release_date ?? new Date().toISOString().slice(0, 10),
    status: input.status ?? "published",
  };
  if (input.id) {
    const { error } = await db.from("comm_release_notes").update(payload).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data: session } = await supabase.auth.getUser();
  const { data, error } = await db
    .from("comm_release_notes")
    .insert({ ...payload, created_by: session.user?.id ?? null })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteReleaseNote(id: string) {
  const { error } = await db.from("comm_release_notes").delete().eq("id", id);
  if (error) throw error;
}
