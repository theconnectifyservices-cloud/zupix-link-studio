/**
 * Brand-aware context loader for AI Content Studio (LS-12B).
 * Aggregates brand kit + workspace metadata so generators produce
 * personalized (not generic) output. Reads go through RLS so a user
 * only sees their own workspace.
 */
import { supabase } from "@/integrations/supabase/client";

export interface BrandContextData {
  workspaceName: string;
  brandName?: string;
  industry?: string;
  targetAudience?: string;
  category?: string;
  brandVoice?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  keywords?: string[];
}

export async function loadBrandContext(workspaceId: string): Promise<BrandContextData> {
  const [wsRes, bkRes] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name,slug,brand_name,description,settings")
      .eq("id", workspaceId)
      .maybeSingle(),
    supabase
      .from("brand_kits")
      .select("name,description,colors,typography")
      .eq("workspace_id", workspaceId)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ws = wsRes.data as {
    name: string;
    brand_name?: string | null;
    description?: string | null;
    settings?: Record<string, unknown> | null;
  } | null;
  const bk = bkRes.data as
    | { name: string; description?: string | null; colors?: Record<string, string> }
    | null;

  const settings = (ws?.settings ?? {}) as Record<string, unknown>;

  return {
    workspaceName: ws?.name ?? "",
    brandName: ws?.brand_name || bk?.name || ws?.name,
    industry: settings.industry as string | undefined,
    targetAudience: settings.targetAudience as string | undefined,
    category: settings.category as string | undefined,
    brandVoice: settings.voice as string | undefined,
    description: ws?.description || bk?.description || undefined,
    primaryColor: bk?.colors?.primary,
    secondaryColor: bk?.colors?.secondary,
    accentColor: bk?.colors?.accent,
    keywords: Array.isArray(settings.keywords) ? (settings.keywords as string[]) : undefined,
  };
}

export function brandContextToPrompt(ctx: BrandContextData): string {
  const lines: string[] = ["## Brand Context"];
  if (ctx.brandName) lines.push(`- Brand: ${ctx.brandName}`);
  if (ctx.description) lines.push(`- About: ${ctx.description}`);
  if (ctx.industry) lines.push(`- Industry: ${ctx.industry}`);
  if (ctx.category) lines.push(`- Category: ${ctx.category}`);
  if (ctx.targetAudience) lines.push(`- Target audience: ${ctx.targetAudience}`);
  if (ctx.brandVoice) lines.push(`- Brand voice: ${ctx.brandVoice}`);
  if (ctx.primaryColor || ctx.secondaryColor || ctx.accentColor)
    lines.push(
      `- Brand colors: ${[ctx.primaryColor, ctx.secondaryColor, ctx.accentColor].filter(Boolean).join(", ")}`,
    );
  if (ctx.keywords?.length) lines.push(`- Keywords: ${ctx.keywords.join(", ")}`);
  if (lines.length === 1) lines.push("- (no brand kit configured yet — use tasteful defaults)");
  lines.push("", "Always tailor output to this brand. Never mention other tenants or invent facts.");
  return lines.join("\n");
}
