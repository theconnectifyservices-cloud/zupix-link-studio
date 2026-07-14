import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "@/features/builder/types";

export interface PublicBioPage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: BioContent;
  updated_at: string;
  published_at: string | null;
  visibility: "public" | "unlisted" | "password";
}

/**
 * Fetch a bio page for public rendering by slug.
 * Serves the **published** content only — drafts never leak.
 * The tightened anon RLS policy filters out non-published rows at the DB.
 */
export async function fetchPublicBioPage(slug: string): Promise<PublicBioPage | null> {
  const { data, error } = await supabase
    .from("bio_pages")
    .select(
      "id,name,slug,description,published_content,updated_at,published_at,visibility",
    )
    .eq("slug", slug.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    published_content: BioContent | null;
    updated_at: string;
    published_at: string | null;
    visibility: "public" | "unlisted" | "password";
  };
  if (!row.published_content) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    updated_at: row.updated_at,
    published_at: row.published_at,
    visibility: row.visibility,
    content: row.published_content,
  };
}

