import { supabase } from "@/integrations/supabase/client";
import type { SeoSettings } from "./types";

const TBL = "bio_pages" as never;

export interface SeoRecord {
  id: string;
  seo: SeoSettings;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
}

export async function fetchSeo(pageId: string): Promise<SeoRecord> {
  const { data, error } = await supabase
    .from(TBL)
    .select("id,seo,favicon_url,apple_touch_icon_url")
    .eq("id", pageId)
    .single();
  if (error) throw error;
  const row = data as unknown as {
    id: string;
    seo: SeoSettings | null;
    favicon_url: string | null;
    apple_touch_icon_url: string | null;
  };
  return {
    id: row.id,
    seo: row.seo ?? {},
    faviconUrl: row.favicon_url,
    appleTouchIconUrl: row.apple_touch_icon_url,
  };
}

export async function updateSeo(
  pageId: string,
  patch: {
    seo?: SeoSettings;
    faviconUrl?: string | null;
    appleTouchIconUrl?: string | null;
  },
) {
  const body: Record<string, unknown> = {};
  if (patch.seo !== undefined) body.seo = patch.seo;
  if (patch.faviconUrl !== undefined) body.favicon_url = patch.faviconUrl;
  if (patch.appleTouchIconUrl !== undefined) body.apple_touch_icon_url = patch.appleTouchIconUrl;
  const { error } = await supabase
    .from(TBL)
    .update(body as never)
    .eq("id", pageId);
  if (error) throw error;
}

/** Check whether a slug is available (excluding a given page id). */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const q = supabase
    .from(TBL)
    .select("id")
    .eq("slug", slug.toLowerCase())
    .is("deleted_at", null);
  const { data, error } = await q;
  if (error) return false;
  const rows = (data as unknown as { id: string }[]) ?? [];
  return rows.every((r) => r.id === excludeId);
}

export async function updateSlug(pageId: string, slug: string) {
  const { error } = await supabase
    .from(TBL)
    .update({ slug: slug.toLowerCase() } as never)
    .eq("id", pageId);
  if (error) throw error;
}
