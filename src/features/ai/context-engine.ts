/**
 * AI Context Engine (LS-12A foundation).
 *
 * Builds a permission-aware snapshot of the current workspace that
 * future AI features can consume as system context. Everything is
 * read through the RLS-enforced Supabase client, so a user only ever
 * sees data they already have access to. Never call from an unauth'd
 * surface.
 */

import { supabase } from "@/integrations/supabase/client";

export interface AiWorkspaceContext {
  workspace: { id: string; name: string; slug: string } | null;
  counts: {
    bioPages: number;
    templates: number;
    mediaAssets: number;
    campaigns: number;
    domains: number;
  };
  recentBioPages: { id: string; name: string; slug: string; status: string }[];
  brandKit: { name: string; primary?: string; secondary?: string } | null;
  preferences: Record<string, unknown> | null;
  generatedAt: string;
}

async function safeCount(table: string, workspaceId: string): Promise<number> {
  const { count } = await supabase
    .from(table as never)
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  return count ?? 0;
}

export async function buildWorkspaceContext(input: {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userId: string;
}): Promise<AiWorkspaceContext> {
  const [bioPages, templatesCount, media, campaigns, domains, recent, brand, prefs] =
    await Promise.all([
      safeCount("bio_pages", input.workspaceId),
      Promise.resolve(0),
      safeCount("media_assets", input.workspaceId),
      safeCount("campaigns", input.workspaceId),
      safeCount("domains", input.workspaceId),
      supabase
        .from("bio_pages")
        .select("id,name,slug,status")
        .eq("workspace_id", input.workspaceId)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("brand_kits")
        .select("name,colors")
        .eq("workspace_id", input.workspaceId)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", input.userId)
        .maybeSingle(),
    ]);

  const brandData = brand.data as { name: string; colors?: Record<string, string> } | null;
  const prefsData = prefs.data as { preferences: Record<string, unknown> } | null;

  return {
    workspace: {
      id: input.workspaceId,
      name: input.workspaceName,
      slug: input.workspaceSlug,
    },
    counts: {
      bioPages,
      templates: templatesCount,
      mediaAssets: media,
      campaigns,
      domains,
    },
    recentBioPages: (recent.data as { id: string; name: string; slug: string; status: string }[] | null) ?? [],
    brandKit: brandData
      ? {
          name: brandData.name,
          primary: brandData.colors?.primary,
          secondary: brandData.colors?.secondary,
        }
      : null,
    preferences: prefsData?.preferences ?? null,
    generatedAt: new Date().toISOString(),
  };
}

/** Serialize context into a concise system prompt block. */
export function contextToSystemPrompt(ctx: AiWorkspaceContext): string {
  const lines: string[] = [
    "You are ZUPIX AI, the intelligent assistant for the ZUPIX Link Studio platform.",
    "You help creators manage bio pages, templates, media, analytics and settings.",
    "Be concise, warm, and action-oriented. Use markdown when it improves clarity.",
    "",
    "## Workspace context",
  ];
  if (ctx.workspace) {
    lines.push(`- Workspace: ${ctx.workspace.name} (@${ctx.workspace.slug})`);
  }
  lines.push(
    `- Counts: ${ctx.counts.bioPages} bio pages · ${ctx.counts.mediaAssets} assets · ${ctx.counts.campaigns} campaigns · ${ctx.counts.domains} domains`,
  );
  if (ctx.recentBioPages.length > 0) {
    lines.push("- Recent bio pages:");
    for (const p of ctx.recentBioPages) {
      lines.push(`  • ${p.name} (/${p.slug}) — ${p.status}`);
    }
  }
  if (ctx.brandKit) {
    lines.push(
      `- Brand kit: ${ctx.brandKit.name}${ctx.brandKit.primary ? ` · primary ${ctx.brandKit.primary}` : ""}`,
    );
  }
  lines.push("", "Only reference data that appears above; never invent tenants or details.");
  return lines.join("\n");
}
