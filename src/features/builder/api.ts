import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "./types";
import { createEmptyBioContent, normalizeBioContent } from "./content-normalizer";

const TBL = "bio_pages" as never;

export interface BuilderPage {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  content: BioContent;
  updated_at: string;
  last_saved_at: string | null;
}

export async function fetchBuilderPage(id: string): Promise<BuilderPage> {
  const { data, error } = await supabase
    .from(TBL)
    .select("id,name,slug,status,content,updated_at,last_saved_at")
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (error) throw error;
  const row = data as unknown as BuilderPage;
  return { ...row, content: normalizeBioContent(row.content) };
}

export async function saveBuilderContent(id: string, content: BioContent): Promise<string> {
  const nowIso = new Date().toISOString();
  const safeContent = normalizeBioContent(content ?? createEmptyBioContent());
  const { error } = await supabase
    .from(TBL)
    .update({ content: safeContent, last_saved_at: nowIso } as never)
    .eq("id", id);
  if (error) throw error;

  // Refresh the media usage graph so the library knows which sections
  // reference each asset. Non-blocking: never fail a save on this.
  void (async () => {
    try {
      const { syncPageUsages } = await import("@/features/media/api");
      await syncPageUsages(id);
    } catch {
      /* usage tracking is best-effort */
    }
  })();

  return nowIso;
}

