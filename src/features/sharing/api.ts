import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_QR_SETTINGS,
  DEFAULT_SHARE_SETTINGS,
  type QrDesignRow,
  type QrSettings,
  type ShareSettings,
} from "./types";

const PAGES = "bio_pages" as never;
const DESIGNS = "qr_designs" as never;

export interface SharingRecord {
  id: string;
  slug: string;
  name: string;
  workspaceId: string;
  status: string;
  publishedAt: string | null;
  qr: QrSettings;
  share: ShareSettings;
  seoImage: string | null;
  faviconUrl: string | null;
}

/** Fetch everything the sharing hub needs for a single bio page. */
export async function fetchSharingRecord(pageId: string): Promise<SharingRecord> {
  const { data, error } = await supabase
    .from(PAGES)
    .select(
      "id,slug,name,workspace_id,status,published_at,qr_settings,share_settings,seo,favicon_url",
    )
    .eq("id", pageId)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  const row = data as unknown as {
    id: string;
    slug: string;
    name: string;
    workspace_id: string;
    status: string;
    published_at: string | null;
    qr_settings: Partial<QrSettings> | null;
    share_settings: Partial<ShareSettings> | null;
    seo: { ogImage?: string | null; description?: string | null; title?: string | null } | null;
    favicon_url: string | null;
  };
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    workspaceId: row.workspace_id,
    status: row.status,
    publishedAt: row.published_at,
    qr: { ...DEFAULT_QR_SETTINGS, ...(row.qr_settings ?? {}) },
    share: { ...DEFAULT_SHARE_SETTINGS, ...(row.share_settings ?? {}) },
    seoImage: row.seo?.ogImage ?? null,
    faviconUrl: row.favicon_url,
  };
}

export async function updateQrSettings(pageId: string, qr: QrSettings) {
  const { error } = await supabase
    .from(PAGES)
    .update({ qr_settings: qr } as never)
    .eq("id", pageId);
  if (error) throw error;
}

export async function updateShareSettings(pageId: string, share: ShareSettings) {
  const { error } = await supabase
    .from(PAGES)
    .update({ share_settings: share } as never)
    .eq("id", pageId);
  if (error) throw error;
}

export async function listQrDesigns(pageId: string): Promise<QrDesignRow[]> {
  const { data, error } = await supabase
    .from(DESIGNS)
    .select("*")
    .eq("page_id", pageId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as QrDesignRow[]) ?? [];
}

export async function saveQrDesign(input: {
  pageId: string;
  workspaceId: string;
  name: string;
  settings: QrSettings;
}): Promise<QrDesignRow> {
  const { data, error } = await supabase
    .from(DESIGNS)
    .insert({
      page_id: input.pageId,
      workspace_id: input.workspaceId,
      name: input.name,
      settings: input.settings,
      is_favorite: true,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as QrDesignRow;
}

export async function deleteQrDesign(id: string) {
  const { error } = await supabase.from(DESIGNS).delete().eq("id", id);
  if (error) throw error;
}
