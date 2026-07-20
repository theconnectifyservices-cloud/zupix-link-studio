import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface HtmlLibraryEntry {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  category: string | null;
  scope: "global" | "workspace" | "page" | "theme";
  page_id: string | null;
  theme_key: string | null;
  html: string;
  css: string;
  js: string;
  preset_key: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export const listHtmlLibrary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { workspaceId: string; includeArchived?: boolean }) => v)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("html_library")
      .select("*")
      .or(`scope.eq.global,workspace_id.eq.${data.workspaceId}`)
      .order("updated_at", { ascending: false });
    if (!data.includeArchived) q = q.is("archived_at", null);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as HtmlLibraryEntry[];
  });

export const saveHtmlLibraryEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (v: {
      id?: string;
      workspaceId: string;
      name: string;
      description?: string;
      category?: string;
      scope?: "global" | "workspace" | "page" | "theme";
      pageId?: string;
      themeKey?: string;
      html: string;
      css?: string;
      js?: string;
      presetKey?: string;
    }) => v,
  )
  .handler(async ({ data, context }) => {
    const payload = {
      workspace_id: data.workspaceId,
      created_by: context.userId,
      name: data.name.slice(0, 120),
      description: data.description ?? null,
      category: data.category ?? null,
      scope: data.scope ?? "workspace",
      page_id: data.pageId ?? null,
      theme_key: data.themeKey ?? null,
      html: data.html,
      css: data.css ?? "",
      js: data.js ?? "",
      preset_key: data.presetKey ?? null,
    };
    if (data.id) {
      const { data: row, error } = await context.supabase
        .from("html_library")
        .update(payload)
        .eq("id", data.id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return row as HtmlLibraryEntry;
    }
    const { data: row, error } = await context.supabase
      .from("html_library")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as HtmlLibraryEntry;
  });

export const duplicateHtmlLibraryEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string; workspaceId: string }) => v)
  .handler(async ({ data, context }) => {
    const { data: src, error: e1 } = await context.supabase
      .from("html_library")
      .select("*")
      .eq("id", data.id)
      .single();
    if (e1 || !src) throw new Error(e1?.message ?? "Not found");
    const { data: row, error } = await context.supabase
      .from("html_library")
      .insert({
        workspace_id: data.workspaceId,
        created_by: context.userId,
        name: `${src.name} (Copy)`,
        description: src.description,
        category: src.category,
        scope: "workspace",
        html: src.html,
        css: src.css,
        js: src.js,
        preset_key: src.preset_key,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as HtmlLibraryEntry;
  });

export const archiveHtmlLibraryEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string; archive: boolean }) => v)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("html_library")
      .update({ archived_at: data.archive ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHtmlLibraryEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: { id: string }) => v)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("html_library").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
