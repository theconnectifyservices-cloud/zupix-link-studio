/**
 * LS-12D — Growth Coach scoring engine.
 *
 * Aggregates category scores (Design, SEO, Engagement, Conversion,
 * Accessibility) into an overall Growth Score. Everything is computed
 * client-side over cached inputs so a re-score is instant; the AI layer
 * (see api.ts) narrates the numbers into prioritized recommendations.
 */
import type { BioContent } from "@/features/builder/types";
import type { EventRow, SessionRow } from "@/features/analytics/api";
import type { SeoSettings } from "@/features/seo/types";
import { computeKpis } from "@/features/analytics/aggregate";
import { analyzePage, type AnalysisReport } from "@/features/ai/design-studio/analyzer";
import { validateSeo } from "@/features/seo/validation";

export interface PageBundle {
  id: string;
  name: string;
  slug: string;
  status: string;
  content: BioContent;
  seo: SeoSettings;
  description?: string | null;
}

export interface GrowthCategoryScore {
  score: number;
  reasons: string[];
}

export interface GrowthScoreReport {
  overall: number;
  design: GrowthCategoryScore;
  seo: GrowthCategoryScore;
  engagement: GrowthCategoryScore;
  conversion: GrowthCategoryScore;
  accessibility: GrowthCategoryScore;
  content: GrowthCategoryScore;
  perPage: Array<{
    pageId: string;
    pageName: string;
    slug: string;
    status: string;
    design: number;
    accessibility: number;
    seo: number;
    analysis: AnalysisReport;
  }>;
  kpis: {
    views: number;
    uniqueVisitors: number;
    returningVisitors: number;
    clicks: number;
    ctr: number;
    avgEngagement: number;
    bounceRate: number;
    conversionRate: number;
  };
  generatedAt: string;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ── Category scorers ──────────────────────────────────────────────────

function scoreSeoPage(bundle: PageBundle): { score: number; reasons: string[] } {
  const warns = validateSeo(bundle.seo, {
    pageName: bundle.name,
    description: bundle.description ?? undefined,
  });
  let score = 100;
  const reasons: string[] = [];
  for (const w of warns) {
    if (w.level === "error") {
      score -= 20;
      reasons.push(w.message);
    } else if (w.level === "warn") {
      score -= 10;
      reasons.push(w.message);
    } else {
      score -= 3;
    }
  }
  if (bundle.status !== "published") {
    score -= 15;
    reasons.push("Page is not published yet — SEO only counts once live.");
  }
  return { score: clamp(score), reasons };
}

function scoreEngagement(
  events: EventRow[],
  sessions: SessionRow[],
): GrowthCategoryScore {
  const reasons: string[] = [];
  const kpis = computeKpis(events, sessions);
  if (kpis.totalViews === 0) {
    return {
      score: 0,
      reasons: ["No traffic yet — publish and share your bio to start collecting data."],
    };
  }
  const engagement = avg(sessions.map((s) => s.engagement_score ?? 0));
  const bounces = sessions.filter((s) => s.is_bounce).length;
  const bounceRate = sessions.length > 0 ? (bounces / sessions.length) * 100 : 100;
  const returnRate =
    kpis.uniqueVisitors > 0 ? (kpis.returningVisitors / kpis.uniqueVisitors) * 100 : 0;

  let score = 30;
  score += Math.min(35, engagement * 0.35);
  score += Math.min(20, returnRate * 0.4);
  score -= Math.min(30, bounceRate * 0.3);

  if (bounceRate > 65) reasons.push(`High bounce rate (${bounceRate.toFixed(0)}%) — tighten the hero and first CTA.`);
  if (returnRate < 8) reasons.push("Few returning visitors — add reasons to come back (updates, gated content).");
  if (engagement < 40) reasons.push("Low engagement score — visitors scroll little or exit fast.");
  if (reasons.length === 0) reasons.push("Healthy engagement — keep publishing.");
  return { score: clamp(score), reasons };
}

function scoreConversion(
  events: EventRow[],
  sessions: SessionRow[],
): GrowthCategoryScore {
  const kpis = computeKpis(events, sessions);
  const reasons: string[] = [];
  if (kpis.totalViews === 0)
    return { score: 0, reasons: ["No traffic yet — conversion needs views first."] };

  const ctr = kpis.ctr;
  let score = 20;
  score += Math.min(60, ctr * 8); // 7.5% CTR → +60
  const clicksPerVisitor =
    kpis.uniqueVisitors > 0 ? kpis.totalClicks / kpis.uniqueVisitors : 0;
  score += Math.min(20, clicksPerVisitor * 15);

  if (ctr < 2)
    reasons.push(`Click-through rate is low (${ctr.toFixed(1)}%) — rewrite CTAs with concrete outcomes.`);
  if (clicksPerVisitor < 0.5)
    reasons.push("Most visitors leave without clicking — move the primary CTA above the fold.");
  if (kpis.qrScans === 0) reasons.push("No QR scans yet — put your QR on packaging, receipts, or slides.");
  if (reasons.length === 0) reasons.push("Conversion is healthy — test a second CTA above the fold.");
  return { score: clamp(score), reasons };
}

function scoreContent(bundles: PageBundle[]): GrowthCategoryScore {
  const reasons: string[] = [];
  if (bundles.length === 0) return { score: 0, reasons: ["No bio pages yet."] };
  let score = 100;
  const published = bundles.filter((b) => b.status === "published").length;
  if (published === 0) {
    score -= 40;
    reasons.push("No published pages — publish at least one bio.");
  }
  const noDesc = bundles.filter((b) => !b.description || b.description.length < 20).length;
  if (noDesc > 0) {
    score -= Math.min(20, noDesc * 5);
    reasons.push(`${noDesc} page(s) missing a strong description.`);
  }
  const emptyContent = bundles.filter((b) => (b.content.blocks ?? []).length < 3).length;
  if (emptyContent > 0) {
    score -= Math.min(30, emptyContent * 10);
    reasons.push(`${emptyContent} page(s) have fewer than 3 blocks.`);
  }
  if (reasons.length === 0) reasons.push("Content coverage looks solid across your pages.");
  return { score: clamp(score), reasons };
}

// ── Entry point ───────────────────────────────────────────────────────

export interface ComputeArgs {
  bundles: PageBundle[];
  events: EventRow[];
  sessions: SessionRow[];
  brand?: { primary?: string; secondary?: string; accent?: string };
  conversionGoals?: { fired: number; total: number };
}

export function computeGrowthScore(args: ComputeArgs): GrowthScoreReport {
  const { bundles, events, sessions, brand = {} } = args;

  const perPage = bundles.map((b) => {
    const analysis = analyzePage({
      content: b.content,
      brand,
      analytics: {
        views: events.filter((e) => e.event_type === "page_view" && e.bio_page_id === b.id)
          .length,
        clicks: events.filter((e) => e.event_type === "link_click" && e.bio_page_id === b.id)
          .length,
      },
    });
    const seoRes = scoreSeoPage(b);
    return {
      pageId: b.id,
      pageName: b.name,
      slug: b.slug,
      status: b.status,
      design: analysis.design.score,
      accessibility: analysis.accessibility.score,
      seo: seoRes.score,
      seoReasons: seoRes.reasons,
      analysis,
    };
  });

  // Aggregate
  const design: GrowthCategoryScore = {
    score: Math.round(avg(perPage.map((p) => p.design))),
    reasons: perPage
      .filter((p) => p.design < 80)
      .slice(0, 3)
      .map((p) => `${p.pageName}: design ${p.design}/100`),
  };
  const accessibility: GrowthCategoryScore = {
    score: Math.round(avg(perPage.map((p) => p.accessibility))),
    reasons: perPage
      .filter((p) => p.accessibility < 80)
      .flatMap((p) =>
        p.analysis.accessibility.findings.slice(0, 1).map((f) => `${p.pageName}: ${f.title}`),
      )
      .slice(0, 4),
  };
  const seo: GrowthCategoryScore = {
    score: Math.round(avg(perPage.map((p) => p.seo))),
    reasons: perPage
      .filter((p) => p.seo < 80)
      .flatMap((p) => p.seoReasons.slice(0, 1).map((r) => `${p.pageName}: ${r}`))
      .slice(0, 4),
  };
  const engagement = scoreEngagement(events, sessions);
  const conversion = scoreConversion(events, sessions);
  const content = scoreContent(bundles);

  const overall = Math.round(
    clamp(
      design.score * 0.18 +
        seo.score * 0.15 +
        engagement.score * 0.2 +
        conversion.score * 0.22 +
        accessibility.score * 0.13 +
        content.score * 0.12,
    ),
  );

  const kpis = computeKpis(events, sessions);
  const bounces = sessions.filter((s) => s.is_bounce).length;
  const bounceRate = sessions.length > 0 ? (bounces / sessions.length) * 100 : 0;
  const avgEngagement = avg(sessions.map((s) => s.engagement_score ?? 0));
  const conversionRate =
    args.conversionGoals && args.conversionGoals.total > 0
      ? (args.conversionGoals.fired / args.conversionGoals.total) * 100
      : kpis.ctr;

  if (design.reasons.length === 0) design.reasons.push("Design looks strong across pages.");
  if (accessibility.reasons.length === 0) accessibility.reasons.push("Accessibility is on track.");
  if (seo.reasons.length === 0) seo.reasons.push("SEO metadata is complete.");

  return {
    overall,
    design,
    seo,
    engagement,
    conversion,
    accessibility,
    content,
    perPage: perPage.map((p) => ({
      pageId: p.pageId,
      pageName: p.pageName,
      slug: p.slug,
      status: p.status,
      design: p.design,
      accessibility: p.accessibility,
      seo: p.seo,
      analysis: p.analysis,
    })),
    kpis: {
      views: kpis.totalViews,
      uniqueVisitors: kpis.uniqueVisitors,
      returningVisitors: kpis.returningVisitors,
      clicks: kpis.totalClicks,
      ctr: kpis.ctr,
      avgEngagement,
      bounceRate,
      conversionRate,
    },
    generatedAt: new Date().toISOString(),
  };
}
