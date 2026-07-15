/**
 * Brand-aware context loader for AI Content Studio (LS-12B).
 * Aggregates brand kit, workspace info, and recent bio-page metadata
 * so generators produce personalized (not generic) output.
 * All reads go through RLS-enforced client; a user only sees their
 * workspace data.
 */
import { supabase } from "@/integrations/supabase/client";

export interface BrandContextData {
  workspaceName: string;
  brandName?: string;
  industry?: string;
  targetAudience?: string;
  category?: string;
  brandVoice?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  keywords?: string[];
}

export async function loadBrandContext(workspaceId: string): Promise<BrandContextData> {
  const [wsRes, bkRes] = await Promise.all([
    supabase.from("workspaces").select("name,slug,brand_settings").eq("id", workspaceId).maybeSingle(),
    supabase
      .from("brand_kits")
      .select("name,colors,typography,metadata")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const ws = wsRes.data as { name: string; brand_settings?: Record<string, unknown> } | null;
  const bk = bkRes.data as
    | { name: string; colors?: Record<string, string>; metadata?: Record<string, unknown> }
    | null;

  const brandSettings = (ws?.brand_settings ?? {}) as Record<string, unknown>;
  const bkMeta = (bk?.metadata ?? {}) as Record<string, unknown>;

  return {
    workspaceName: ws?.name ?? "",
    brandName: (bkMeta.brandName as string) || bk?.name || (brandSettings.brandName as string) || ws?.name,
    industry: (bkMeta.industry as string) || (brandSettings.industry as string),
    targetAudience: (bkMeta.targetAudience as string) || (brandSettings.targetAudience as string),
    category: (bkMeta.category as string) || (brandSettings.category as string),
    brandVoice: (bkMeta.voice as string) || (brandSettings.voice as string),
    primaryColor: bk?.colors?.primary,
    secondaryColor: bk?.colors?.secondary,
    accentColor: bk?.colors?.accent,
    keywords: (bkMeta.keywords as string[]) || undefined,
  };
}

export function brandContextToPrompt(ctx: BrandContextData): string {
  const lines: string[] = ["## Brand Context"];
  if (ctx.brandName) lines.push(`- Brand: ${ctx.brandName}`);
  if (ctx.industry) lines.push(`- Industry: ${ctx.industry}`);
  if (ctx.category) lines.push(`- Category: ${ctx.category}`);
  if (ctx.targetAudience) lines.push(`- Target audience: ${ctx.targetAudience}`);
  if (ctx.brandVoice) lines.push(`- Brand voice: ${ctx.brandVoice}`);
  if (ctx.primaryColor || ctx.secondaryColor)
    lines.push(
      `- Brand colors: ${[ctx.primaryColor, ctx.secondaryColor, ctx.accentColor].filter(Boolean).join(", ")}`,
    );
  if (ctx.keywords?.length) lines.push(`- Keywords: ${ctx.keywords.join(", ")}`);
  if (lines.length === 1) lines.push("- (no brand kit configured yet — use tasteful defaults)");
  lines.push("", "Always tailor output to this brand. Never mention other tenants.");
  return lines.join("\n");
}
