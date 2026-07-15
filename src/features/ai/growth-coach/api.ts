/**
 * LS-12D — Growth Coach API.
 *
 * Bundles per-workspace data (bio pages, SEO, analytics) into a scoring
 * report, generates AI-narrated recommendations via /api/ai/generate, and
 * persists actions/snapshots in ai_activity (kinds:
 * growth_score_snapshot, growth_recommendation, growth_action).
 */
import { supabase } from "@/integrations/supabase/client";
import { listBioPages, type BioPageRow } from "@/features/bio-pages/api";
import { fetchBuilderPage } from "@/features/builder/api";
import { fetchSeo } from "@/features/seo/api";
import { fetchEvents, fetchSessions, resolveRange } from "@/features/analytics/api";
import { loadBrandContext, brandContextToPrompt } from "@/features/ai/content-studio/brand-context";
import type { AiActivity } from "@/features/ai/types";
import { computeGrowthScore, type GrowthScoreReport, type PageBundle } from "./scoring";

export interface LoadReportArgs {
  workspaceId: string;
  rangeDays?: 7 | 30 | 90;
  pageIds?: string[]; // if omitted, scores across the whole workspace
}

export async function loadGrowthReport(
  args: LoadReportArgs,
): Promise<{ report: GrowthScoreReport; pages: BioPageRow[] }> {
  const { workspaceId, rangeDays = 30, pageIds } = args;
  const rangeKey = rangeDays === 7 ? "7d" : rangeDays === 30 ? "30d" : "90d";
  const range = resolveRange(rangeKey);

  const pages = await listBioPages(workspaceId);
  const scope = pageIds?.length ? pages.filter((p) => pageIds.includes(p.id)) : pages;

  const [bundles, events, sessions, brand] = await Promise.all([
    Promise.all(
      scope.map(async (p): Promise<PageBundle> => {
        const [builder, seo] = await Promise.all([
          fetchBuilderPage(p.id).catch(() => null),
          fetchSeo(p.id).catch(() => null),
        ]);
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          status: p.status,
          description: p.description,
          content: builder?.content ?? { blocks: [] },
          seo: seo?.seo ?? {},
        };
      }),
    ),
    fetchEvents(workspaceId, range).catch(() => []),
    fetchSessions(workspaceId, range).catch(() => []),
    loadBrandContext(workspaceId).catch(() => null),
  ]);

  const report = computeGrowthScore({
    bundles,
    events,
    sessions,
    brand: {
      primary: brand?.primaryColor,
      secondary: brand?.secondaryColor,
      accent: brand?.accentColor,
    },
  });
  return { report, pages };
}

// ── AI recommendations ────────────────────────────────────────────────

export interface GrowthAction {
  id: string;
  title: string;
  category: "seo" | "design" | "engagement" | "conversion" | "accessibility" | "content";
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  steps: string[];
  target?: { pageId?: string };
  rationale: string;
}

export interface GrowthRecommendation {
  summary: string;
  actions: GrowthAction[];
  generatedAt: string;
}

function buildRecommendationPrompt(report: GrowthScoreReport, brandBlock: string) {
  return `${brandBlock}

You are ZUPIX Growth Coach. Analyze the score report below and output a JSON object with:
- "summary": 2-3 sentence executive summary
- "actions": array of 4-8 items, each with: title, category (seo|design|engagement|conversion|accessibility|content), impact (low|medium|high), effort (low|medium|high), steps (array of 2-4 concrete steps), rationale (1 sentence). Optional target.pageId if the fix applies to one page.
Focus on the highest-impact, lowest-effort wins first. Reference real numbers from the report.
Never invent metrics. Return ONLY valid JSON — no prose, no markdown fences.

## Score Report
Overall: ${report.overall}
Design: ${report.design.score} — ${report.design.reasons.join(" | ")}
SEO: ${report.seo.score} — ${report.seo.reasons.join(" | ")}
Accessibility: ${report.accessibility.score} — ${report.accessibility.reasons.join(" | ")}
Engagement: ${report.engagement.score} — ${report.engagement.reasons.join(" | ")}
Conversion: ${report.conversion.score} — ${report.conversion.reasons.join(" | ")}
Content: ${report.content.score} — ${report.content.reasons.join(" | ")}

## KPIs (last window)
Views: ${report.kpis.views}, Unique: ${report.kpis.uniqueVisitors}, Returning: ${report.kpis.returningVisitors}
Clicks: ${report.kpis.clicks}, CTR: ${report.kpis.ctr.toFixed(2)}%, Bounce: ${report.kpis.bounceRate.toFixed(1)}%
Avg Engagement: ${report.kpis.avgEngagement.toFixed(1)}

## Pages (${report.perPage.length})
${report.perPage
  .slice(0, 8)
  .map(
    (p) =>
      `- ${p.pageName} [${p.status}] design=${p.design} a11y=${p.accessibility} seo=${p.seo} (id=${p.pageId})`,
  )
  .join("\n")}`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(trimmed);
}

export async function generateRecommendations(
  workspaceId: string,
  report: GrowthScoreReport,
): Promise<GrowthRecommendation> {
  const brand = await loadBrandContext(workspaceId).catch(() => null);
  const brandBlock = brand ? brandContextToPrompt(brand) : "";

  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system:
        "You are ZUPIX Growth Coach — a senior conversion strategist. Respond with strict JSON only.",
      prompt: buildRecommendationPrompt(report, brandBlock),
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  const { content } = (await res.json()) as { content: string };

  let parsed: { summary?: string; actions?: unknown[] };
  try {
    parsed = extractJson(content) as { summary?: string; actions?: unknown[] };
  } catch {
    throw new Error("AI returned invalid JSON. Please retry.");
  }

  const actions: GrowthAction[] = (parsed.actions ?? []).map((raw, i) => {
    const a = raw as Partial<GrowthAction> & { target?: { pageId?: string } };
    return {
      id: `rec_${Date.now()}_${i}`,
      title: String(a.title ?? "Untitled action"),
      category: (a.category ?? "content") as GrowthAction["category"],
      impact: (a.impact ?? "medium") as GrowthAction["impact"],
      effort: (a.effort ?? "medium") as GrowthAction["effort"],
      steps: Array.isArray(a.steps) ? a.steps.map(String) : [],
      target: a.target,
      rationale: String(a.rationale ?? ""),
    };
  });

  const recommendation: GrowthRecommendation = {
    summary: String(parsed.summary ?? ""),
    actions,
    generatedAt: new Date().toISOString(),
  };

  await saveActivity(workspaceId, "growth_recommendation", "Generated growth recommendations", {
    overall: report.overall,
    recommendation,
  });
  await saveActivity(workspaceId, "growth_score_snapshot", `Overall score ${report.overall}`, {
    overall: report.overall,
    design: report.design.score,
    seo: report.seo.score,
    engagement: report.engagement.score,
    conversion: report.conversion.score,
    accessibility: report.accessibility.score,
    content: report.content.score,
    kpis: report.kpis,
  });

  return recommendation;
}

// ── Action tracking ───────────────────────────────────────────────────

export type ActionStatus = "pending" | "in_progress" | "completed" | "dismissed";

export interface ActionRecord {
  id: string; // ai_activity row id
  actionId: string;
  title: string;
  status: ActionStatus;
  action: GrowthAction;
  createdAt: string;
  updatedAt: string;
}

async function saveActivity(
  workspaceId: string,
  kind: string,
  summary: string,
  metadata: Record<string, unknown>,
): Promise<AiActivity> {
  const { data: user } = await supabase.auth.getUser();
  const uid = user.user?.id;
  if (!uid) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("ai_activity")
    .insert({
      workspace_id: workspaceId,
      user_id: uid,
      kind,
      summary,
      metadata,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as AiActivity;
}

export async function trackAction(
  workspaceId: string,
  action: GrowthAction,
): Promise<ActionRecord> {
  const row = await saveActivity(
    workspaceId,
    "growth_action",
    action.title,
    { action, status: "pending" satisfies ActionStatus },
  );
  return {
    id: row.id,
    actionId: action.id,
    title: action.title,
    status: "pending",
    action,
    createdAt: row.created_at,
    updatedAt: row.created_at,
  };
}

export async function updateActionStatus(
  rowId: string,
  status: ActionStatus,
): Promise<void> {
  const { data: current, error: fetchErr } = await supabase
    .from("ai_activity")
    .select("metadata")
    .eq("id", rowId)
    .single();
  if (fetchErr) throw fetchErr;
  const meta = (current?.metadata ?? {}) as Record<string, unknown>;
  const nextMeta = { ...meta, status, updatedAt: new Date().toISOString() };
  const { error } = await supabase
    .from("ai_activity")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ metadata: nextMeta as any })
    .eq("id", rowId);
  if (error) throw error;
}

export async function listTrackedActions(workspaceId: string): Promise<ActionRecord[]> {
  const { data, error } = await supabase
    .from("ai_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("kind", "growth_action")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as AiActivity[]).map((row) => {
    const meta = row.metadata as { action?: GrowthAction; status?: ActionStatus };
    const action = meta.action ?? {
      id: row.id,
      title: row.summary,
      category: "content",
      impact: "medium",
      effort: "medium",
      steps: [],
      rationale: "",
    };
    return {
      id: row.id,
      actionId: action.id,
      title: action.title,
      status: meta.status ?? "pending",
      action,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  });
}

export interface ScoreSnapshot {
  id: string;
  overall: number;
  design: number;
  seo: number;
  engagement: number;
  conversion: number;
  accessibility: number;
  content: number;
  createdAt: string;
}

export async function listScoreHistory(workspaceId: string): Promise<ScoreSnapshot[]> {
  const { data, error } = await supabase
    .from("ai_activity")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("kind", "growth_score_snapshot")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as AiActivity[]).map((row) => {
    const m = row.metadata as Record<string, number>;
    return {
      id: row.id,
      overall: Number(m.overall ?? 0),
      design: Number(m.design ?? 0),
      seo: Number(m.seo ?? 0),
      engagement: Number(m.engagement ?? 0),
      conversion: Number(m.conversion ?? 0),
      accessibility: Number(m.accessibility ?? 0),
      content: Number(m.content ?? 0),
      createdAt: row.created_at,
    };
  });
}
