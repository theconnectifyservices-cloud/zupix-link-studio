import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "@/features/builder/types";
import type { SeoSettings } from "@/features/seo/types";

export interface PublicBioPage {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  content: BioContent;
  updated_at: string;
  published_at: string | null;
  visibility: "public" | "unlisted" | "password";
  seo: SeoSettings;
  faviconUrl: string | null;
  appleTouchIconUrl: string | null;
}

/**
 * Fetch a bio page for public rendering by slug.
 * Serves the **published** content only — drafts never leak.
 * RLS restricts anon to status='published' pages.
 */
export async function fetchPublicBioPage(slug: string): Promise<PublicBioPage | null> {
  const { data, error } = await supabase
    .from("bio_pages")
    .select(
      "id,workspace_id,name,slug,description,published_content,updated_at,published_at,visibility,seo,favicon_url,apple_touch_icon_url",
    )
    .eq("slug", slug.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    workspace_id: string;
    name: string;
    slug: string;
    description: string | null;
    published_content: BioContent | null;
    updated_at: string;
    published_at: string | null;
    visibility: "public" | "unlisted" | "password";
    seo: SeoSettings | null;
    favicon_url: string | null;
    apple_touch_icon_url: string | null;
  };
  if (!row.published_content) return null;
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    updated_at: row.updated_at,
    published_at: row.published_at,
    visibility: row.visibility,
    content: row.published_content,
    seo: row.seo ?? {},
    faviconUrl: row.favicon_url,
    appleTouchIconUrl: row.apple_touch_icon_url,
  };
}

/** List every published, indexable page for sitemap generation. */
export async function listIndexableSlugs(): Promise<
  { slug: string; updated_at: string; published_at: string | null }[]
> {
  const { data, error } = await supabase
    .from("bio_pages")
    .select("slug,updated_at,published_at,visibility,status,seo")
    .eq("status", "published")
    .in("visibility", ["public"])
    .is("deleted_at", null);
  if (error) throw error;
  const rows = (data as unknown as {
    slug: string;
    updated_at: string;
    published_at: string | null;
    visibility: string;
    status: string;
    seo: SeoSettings | null;
  }[]) ?? [];
  return rows
    .filter((r) => (r.seo?.robotsIndex ?? true) !== false)
    .map(({ slug, updated_at, published_at }) => ({ slug, updated_at, published_at }));
}
