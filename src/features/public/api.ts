import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "@/features/builder/types";

export interface PublicBioPage {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  content: BioContent;
  updated_at: string;
}

/**
 * Fetch a bio page for public rendering by slug.
 * Returns null when the page is missing, deleted, private, or archived —
 * anon RLS policy on `bio_pages` enforces this at the database level.
 * Only the minimal, non-sensitive columns needed for rendering are selected;
 * workspace / owner / status metadata is never exposed to the client.
 */
export async function fetchPublicBioPage(slug: string): Promise<PublicBioPage | null> {
  const { data, error } = await supabase
    .from("bio_pages")
    .select("id,name,slug,description,content,updated_at")
    .eq("slug", slug.toLowerCase())
    .is("deleted_at", null)
    .neq("visibility", "private")
    .neq("status", "archived")
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PublicBioPage) ?? null;
}
