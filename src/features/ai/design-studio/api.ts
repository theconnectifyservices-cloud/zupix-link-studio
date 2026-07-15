/**
 * LS-12C — AI Design Studio API.
 *
 * Wraps three things:
 *  1. AI narrative recommendations (calls /api/ai/generate).
 *  2. Applying a partial theme patch to a bio page.
 *  3. Design history via ai_activity (kind = "design_suggestion").
 */
import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "@/features/builder/types";
import type { PageTheme } from "@/features/builder/theme";
import { DEFAULT_THEME } from "@/features/builder/theme";
import type { AiActivity } from "../types";
import type { AnalysisReport } from "./analyzer";

// ── AI recommendations ────────────────────────────────────────────────

export interface AiRecommendation {
  title: string;
  reason: string;
  category: string;
  priority: "high" | "medium" | "low";
}

export async function generateRecommendations(
  report: AnalysisReport,
  brandContext: string,
): Promise<AiRecommendation[]> {
  const findings = [
    ...report.design.findings,
    ...report.brand.findings,
    ...report.accessibility.findings,
    ...report.cta.findings,
    ...report.layout.findings,
    ...report.conversion.findings,
  ]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map((f) => `- [${f.severity}] (${f.category}) ${f.title}: ${f.detail}`)
    .join("\n");

  const system = [
    "You are a senior product designer specializing in bio landing pages that convert.",
    "Return recommendations that are specific, actionable, and non-generic.",
    brandContext,
  ].join("\n\n");

  const prompt = [
    "## Current design report",
    `Overall score: ${report.overall}/100`,
    `Design: ${report.design.score} · Brand: ${report.brand.score} · A11y: ${report.accessibility.score} · CTA: ${report.cta.score} · Layout: ${report.layout.score} · Conversion: ${report.conversion.score}`,
    `Blocks: ${report.meta.blockCount} · Buttons: ${report.meta.buttonCount} · Images: ${report.meta.imageCount}`,
    "",
    "## Top findings",
    findings || "(no findings)",
    "",
    'Return a JSON array (max 6 items) of {"title": string, "reason": string, "category": string, "priority": "high"|"medium"|"low"}. Only JSON, no prose.',
  ].join("\n");

  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, prompt, temperature: 0.6 }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || `AI request failed (${res.status})`);
  }
  const { content } = (await res.json()) as { content: string };
  return parseJsonArray(content);
}

function parseJsonArray(text: string): AiRecommendation[] {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? text).trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(raw.slice(start, end + 1)) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({
        title: String(x.title ?? "Recommendation"),
        reason: String(x.reason ?? ""),
        category: String(x.category ?? "design"),
        priority: (x.priority === "high" || x.priority === "low"
          ? x.priority
          : "medium") as AiRecommendation["priority"],
      }));
  } catch {
    return [];
  }
}

// ── Apply theme patch ─────────────────────────────────────────────────

export function mergeTheme(base: PageTheme | undefined, patch: DeepPartial<PageTheme>): PageTheme {
  const cur = base ?? DEFAULT_THEME;
  return {
    ...cur,
    ...patch,
    colors: { ...cur.colors, ...(patch.colors ?? {}) },
    typography: { ...cur.typography, ...(patch.typography ?? {}) },
    spacing: { ...cur.spacing, ...(patch.spacing ?? {}) },
    card: { ...cur.card, ...(patch.card ?? {}) },
    buttons: patch.buttons ? { ...cur.buttons, ...patch.buttons } : cur.buttons,
    background: patch.background ? { ...cur.background, ...patch.background } : cur.background,
    profile: patch.profile ? { ...cur.profile, ...patch.profile } : cur.profile,
    motion: patch.motion ? { ...cur.motion, ...patch.motion } : cur.motion,
  } as PageTheme;
}

export async function applyThemePatch(
  pageId: string,
  currentContent: BioContent,
  patch: DeepPartial<PageTheme>,
): Promise<BioContent> {
  const next: BioContent = {
    ...currentContent,
    theme: mergeTheme(currentContent.theme, patch),
  };
  const { error } = await supabase
    .from("bio_pages")
    .update({ content: next, last_saved_at: new Date().toISOString() } as never)
    .eq("id", pageId);
  if (error) throw error;
  return next;
}

export async function restoreContent(pageId: string, content: BioContent): Promise<void> {
  const { error } = await supabase
    .from("bio_pages")
    .update({ content, last_saved_at: new Date().toISOString() } as never)
    .eq("id", pageId);
  if (error) throw error;
}

// ── Design history via ai_activity ────────────────────────────────────

export type DesignHistoryStatus = "applied" | "rejected" | "previewed";

export interface DesignHistoryEntry {
  workspaceId: string;
  userId: string;
  pageId: string;
  category: string;
  suggestionTitle: string;
  status: DesignHistoryStatus;
  score?: number;
  patch?: DeepPartial<PageTheme>;
  snapshot?: BioContent;
}

export async function recordDesignHistory(entry: DesignHistoryEntry): Promise<AiActivity> {
  const metadata = {
    pageId: entry.pageId,
    category: entry.category,
    status: entry.status,
    score: entry.score,
    patch: entry.patch,
    snapshot: entry.snapshot,
  };
  const { data, error } = await supabase
    .from("ai_activity")
    .insert({
      workspace_id: entry.workspaceId,
      user_id: entry.userId,
      kind: "design_suggestion",
      summary: `${entry.status}: ${entry.suggestionTitle}`,
      metadata,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as AiActivity;
}

export async function listDesignHistory(
  workspaceId: string,
  pageId?: string,
): Promise<AiActivity[]> {
  const q = supabase
    .from("ai_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("kind", "design_suggestion")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as AiActivity[];
  if (!pageId) return rows;
  return rows.filter(
    (r) => (r.metadata as Record<string, unknown> | null)?.pageId === pageId,
  );
}

// ── util ──────────────────────────────────────────────────────────────

type DeepPartial<T> = {
  [K in keyof T]?: NonNullable<T[K]> extends object ? DeepPartial<NonNullable<T[K]>> : T[K];
};
