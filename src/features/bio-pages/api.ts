import { supabase } from "@/integrations/supabase/client";

export type BioPageStatus = "draft" | "published" | "scheduled" | "archived" | "unpublished";
export type BioPageVisibility = "public" | "private" | "unlisted" | "password";

export interface BioPageRow {
  id: string;
  workspace_id: string;
  owner_id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  status: BioPageStatus;
  visibility: BioPageVisibility;
  archived_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

const TBL = "bio_pages" as never;

export async function listBioPages(workspaceId: string): Promise<BioPageRow[]> {
  const { data, error } = await supabase
    .from(TBL)
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as BioPageRow[]) ?? [];
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(TBL)
    .select("id")
    .eq("slug", slug.toLowerCase())
    .is("deleted_at", null)
    .maybeSingle();
  if (error) return false;
  return !data;
}

export interface CreateBioPageInput {
  workspaceId: string;
  ownerId: string;
  name: string;
  slug: string;
  category?: string | null;
  description?: string | null;
}

export async function createBioPage(input: CreateBioPageInput): Promise<BioPageRow> {
  const { data, error } = await supabase
    .from(TBL)
    .insert({
      workspace_id: input.workspaceId,
      owner_id: input.ownerId,
      name: input.name,
      slug: input.slug.toLowerCase(),
      category: input.category ?? null,
      description: input.description ?? null,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as BioPageRow;
}

export async function renameBioPage(id: string, name: string) {
  const { error } = await supabase
    .from(TBL)
    .update({ name } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function duplicateBioPage(row: BioPageRow): Promise<BioPageRow> {
  // Generate a unique slug by appending -copy / -copy-2 etc.
  const base = `${row.slug}-copy`.slice(0, 45);
  let candidate = base;
  let i = 2;
  // Try a few times
  while (!(await checkSlugAvailable(candidate))) {
    candidate = `${base}-${i++}`;
    if (i > 20) throw new Error("Could not generate unique slug");
  }
  return createBioPage({
    workspaceId: row.workspace_id,
    ownerId: row.owner_id,
    name: `${row.name} (Copy)`,
    slug: candidate,
    category: row.category,
    description: row.description,
  });
}

export async function archiveBioPage(id: string) {
  const { error } = await supabase
    .from(TBL)
    .update({ status: "archived", archived_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function restoreBioPage(id: string) {
  const { error } = await supabase
    .from(TBL)
    .update({ status: "draft", archived_at: null } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteBioPage(id: string) {
  const { error } = await supabase
    .from(TBL)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}
