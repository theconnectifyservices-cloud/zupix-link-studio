/**
 * LS-12C — Design Analyzer.
 *
 * Local heuristic analysis of a bio page. Runs synchronously in the browser
 * so scores are instant; AI narrative recommendations are layered on top
 * via `api.ts`. Nothing here talks to the network.
 */
import type { BioContent } from "@/features/builder/types";
import type { PageTheme, ThemeColors } from "@/features/builder/theme";
import { DEFAULT_THEME } from "@/features/builder/theme";

export type Severity = "info" | "warn" | "critical";

export interface Finding {
  id: string;
  severity: Severity;
  category: "design" | "brand" | "color" | "typography" | "cta" | "layout" | "a11y" | "conversion";
  title: string;
  detail: string;
  /** Points deducted from the relevant category score. */
  weight: number;
}

export interface CategoryScore {
  score: number; // 0..100
  findings: Finding[];
}

export interface AnalysisReport {
  overall: number; // 0..100
  design: CategoryScore;
  brand: CategoryScore;
  accessibility: CategoryScore;
  cta: CategoryScore;
  layout: CategoryScore;
  conversion: CategoryScore;
  meta: {
    blockCount: number;
    buttonCount: number;
    imageCount: number;
    hasProfile: boolean;
  };
}

// ── Color utilities (WCAG relative luminance) ─────────────────────────

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return 1;
  const la = luminance(ra) + 0.05;
  const lb = luminance(rb) + 0.05;
  return la > lb ? la / lb : lb / la;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

// ── Category analyzers ────────────────────────────────────────────────

function analyzeDesign(content: BioContent, theme: PageTheme): CategoryScore {
  const findings: Finding[] = [];
  const blocks = content.blocks ?? [];
  const count = blocks.length;

  if (count === 0)
    findings.push({
      id: "design.empty",
      severity: "critical",
      category: "design",
      title: "Empty page",
      detail: "Add a profile, a headline and at least one CTA button.",
      weight: 60,
    });
  else if (count > 25)
    findings.push({
      id: "design.overload",
      severity: "warn",
      category: "design",
      title: "Content overload",
      detail: `You have ${count} blocks — visitors scan the top 5 seconds. Consider grouping or removing low-value blocks.`,
      weight: 15,
    });

  const hasProfile = blocks.some((b) => b.type === "profile");
  if (!hasProfile)
    findings.push({
      id: "design.noProfile",
      severity: "warn",
      category: "design",
      title: "Missing profile block",
      detail: "A profile block anchors visual hierarchy and builds trust.",
      weight: 12,
    });

  const gap = theme.spacing?.blockGap ?? 8;
  if (gap < 6)
    findings.push({
      id: "design.gap",
      severity: "info",
      category: "design",
      title: "Tight block spacing",
      detail: "Increase block gap to 12–16px for a more premium rhythm.",
      weight: 6,
    });

  const radius = theme.spacing?.radius ?? 12;
  const btnRadius = theme.buttons?.radius ?? 12;
  if (Math.abs(radius - btnRadius) > 12)
    findings.push({
      id: "design.radiusMismatch",
      severity: "info",
      category: "design",
      title: "Corner radius inconsistency",
      detail: "Page radius and button radius differ significantly — align them for visual cohesion.",
      weight: 5,
    });

  const deduct = findings.reduce((a, f) => a + f.weight, 0);
  return { score: clamp(100 - deduct), findings };
}

function analyzeBrand(theme: PageTheme, brand: BrandInputs): CategoryScore {
  const findings: Finding[] = [];
  const { primary, secondary, accent } = brand;

  if (primary && theme.colors.primary.toLowerCase() !== primary.toLowerCase())
    findings.push({
      id: "brand.primary",
      severity: "warn",
      category: "brand",
      title: "Primary color drift",
      detail: `Page primary is ${theme.colors.primary} but brand primary is ${primary}.`,
      weight: 20,
    });
  if (secondary && theme.colors.secondary.toLowerCase() !== secondary.toLowerCase())
    findings.push({
      id: "brand.secondary",
      severity: "info",
      category: "brand",
      title: "Secondary color drift",
      detail: `Page secondary is ${theme.colors.secondary} but brand secondary is ${secondary}.`,
      weight: 10,
    });
  if (accent && theme.colors.accent.toLowerCase() !== accent.toLowerCase())
    findings.push({
      id: "brand.accent",
      severity: "info",
      category: "brand",
      title: "Accent color drift",
      detail: `Page accent is ${theme.colors.accent} but brand accent is ${accent}.`,
      weight: 8,
    });

  const heading = theme.typography.headingFamily ?? "";
  const body = theme.typography.fontFamily ?? "";
  if (heading === body)
    findings.push({
      id: "brand.fontPair",
      severity: "info",
      category: "brand",
      title: "Single-family typography",
      detail: "Pair a display font for headings with a neutral body font for a distinctive identity.",
      weight: 5,
    });

  const deduct = findings.reduce((a, f) => a + f.weight, 0);
  return { score: clamp(100 - deduct), findings };
}

function analyzeAccessibility(theme: PageTheme): CategoryScore {
  const findings: Finding[] = [];
  const c: ThemeColors = theme.colors;

  const bodyCr = contrastRatio(c.text, c.backgroundSolid || c.background);
  if (bodyCr < 4.5)
    findings.push({
      id: "a11y.body",
      severity: bodyCr < 3 ? "critical" : "warn",
      category: "a11y",
      title: "Body text contrast below WCAG AA",
      detail: `Contrast ratio ${bodyCr.toFixed(2)}:1. Aim for ≥ 4.5:1.`,
      weight: bodyCr < 3 ? 30 : 18,
    });

  const btnCr = contrastRatio(c.primaryText, c.primary);
  if (btnCr < 4.5)
    findings.push({
      id: "a11y.button",
      severity: btnCr < 3 ? "critical" : "warn",
      category: "a11y",
      title: "Button label contrast below AA",
      detail: `Contrast ratio ${btnCr.toFixed(2)}:1 between button text and background.`,
      weight: btnCr < 3 ? 25 : 15,
    });

  const btnHeight = theme.buttons?.height ?? 48;
  if (btnHeight < 44)
    findings.push({
      id: "a11y.tapTarget",
      severity: "warn",
      category: "a11y",
      title: "Tap targets too small",
      detail: `Button height ${btnHeight}px is below the 44px accessibility minimum.`,
      weight: 12,
    });

  const base = theme.typography.baseSize ?? 14;
  if (base < 14)
    findings.push({
      id: "a11y.fontSize",
      severity: "info",
      category: "a11y",
      title: "Base font size below 14px",
      detail: "Small text hurts readability on mobile; use ≥ 14px.",
      weight: 8,
    });

  const lh = theme.typography.lineHeight ?? 1.5;
  if (lh < 1.35)
    findings.push({
      id: "a11y.lineHeight",
      severity: "info",
      category: "a11y",
      title: "Tight line height",
      detail: `Line height ${lh} is dense. 1.5–1.6 is easier to read.`,
      weight: 6,
    });

  const deduct = findings.reduce((a, f) => a + f.weight, 0);
  return { score: clamp(100 - deduct), findings };
}

function analyzeCta(content: BioContent, theme: PageTheme): CategoryScore {
  const findings: Finding[] = [];
  const blocks = content.blocks ?? [];
  const buttons = blocks.filter((b) => b.type === "button" || b.type === "buttonGroup");
  const buttonCount = buttons.length;

  if (buttonCount === 0)
    findings.push({
      id: "cta.none",
      severity: "critical",
      category: "cta",
      title: "No CTAs on page",
      detail: "Every bio page needs at least one clear call-to-action button.",
      weight: 40,
    });
  else if (buttonCount > 8)
    findings.push({
      id: "cta.too-many",
      severity: "warn",
      category: "cta",
      title: "Too many CTAs",
      detail: `You have ${buttonCount} buttons — visitors freeze on choice overload. Keep 3–6 primary actions.`,
      weight: 18,
    });

  const firstButtonIdx = blocks.findIndex((b) => b.type === "button" || b.type === "buttonGroup");
  if (firstButtonIdx > 4)
    findings.push({
      id: "cta.buried",
      severity: "warn",
      category: "cta",
      title: "Primary CTA buried",
      detail: "Move your top CTA within the first 3 blocks so it's visible above the fold on mobile.",
      weight: 15,
    });

  const btnHeight = theme.buttons?.height ?? 48;
  if (btnHeight < 44)
    findings.push({
      id: "cta.small",
      severity: "warn",
      category: "cta",
      title: "CTA buttons are small",
      detail: "Use ≥ 48px tall buttons for premium tap targets.",
      weight: 10,
    });

  // Generic labels
  const generic = /^(click here|learn more|submit|link|button|website)$/i;
  for (const b of buttons) {
    if (b.type === "button") {
      const label = (b as unknown as { label?: string }).label ?? "";
      if (generic.test(label.trim()))
        findings.push({
          id: `cta.generic.${b.id}`,
          severity: "info",
          category: "cta",
          title: `Generic CTA text: "${label}"`,
          detail: 'Use benefit-led labels like "Book a free call" or "Get the guide".',
          weight: 5,
        });
    }
  }

  const deduct = findings.reduce((a, f) => a + f.weight, 0);
  return { score: clamp(100 - deduct), findings };
}

function analyzeLayout(content: BioContent): CategoryScore {
  const findings: Finding[] = [];
  const blocks = content.blocks ?? [];

  const buttonRuns = countConsecutive(blocks.map((b) => b.type), "button");
  if (buttonRuns.max >= 5)
    findings.push({
      id: "layout.buttonWall",
      severity: "warn",
      category: "layout",
      title: "Wall of buttons",
      detail: `You have ${buttonRuns.max} buttons stacked in a row — break them up with dividers, headings, or a button group.`,
      weight: 15,
    });

  const firstProfileIdx = blocks.findIndex((b) => b.type === "profile");
  if (firstProfileIdx > 0 && firstProfileIdx !== -1)
    findings.push({
      id: "layout.profileOrder",
      severity: "info",
      category: "layout",
      title: "Profile not first",
      detail: "Placing the profile block at the top improves recognition and trust.",
      weight: 8,
    });

  const dividers = blocks.filter((b) => b.type === "divider").length;
  if (blocks.length > 10 && dividers === 0)
    findings.push({
      id: "layout.noDividers",
      severity: "info",
      category: "layout",
      title: "Long page with no dividers",
      detail: "Add dividers or spacers to segment your page into scannable sections.",
      weight: 6,
    });

  const deduct = findings.reduce((a, f) => a + f.weight, 0);
  return { score: clamp(100 - deduct), findings };
}

function analyzeConversion(
  content: BioContent,
  analytics: AnalyticsInputs | undefined,
): CategoryScore {
  const findings: Finding[] = [];
  const blocks = content.blocks ?? [];
  const totalViews = analytics?.views ?? 0;
  const clicks = analytics?.clicks ?? 0;
  const ctr = totalViews > 0 ? (clicks / totalViews) * 100 : null;

  if (ctr !== null && ctr < 2)
    findings.push({
      id: "conv.lowCtr",
      severity: "warn",
      category: "conversion",
      title: `Low click-through rate (${ctr.toFixed(1)}%)`,
      detail:
        "Rewrite your primary CTA to promise a concrete outcome, and move it above the fold.",
      weight: 20,
    });

  if (blocks.length > 0 && blocks[0]?.type !== "profile" && blocks[0]?.type !== "heading")
    findings.push({
      id: "conv.hero",
      severity: "info",
      category: "conversion",
      title: "Weak hero structure",
      detail: "Lead with a profile or a strong headline — the first 3 seconds decide engagement.",
      weight: 10,
    });

  const socialCount = blocks.filter((b) => b.type === "social").length;
  if (socialCount === 0)
    findings.push({
      id: "conv.social",
      severity: "info",
      category: "conversion",
      title: "No social proof",
      detail: "Add social links or a testimonials block to raise perceived credibility.",
      weight: 8,
    });

  const deduct = findings.reduce((a, f) => a + f.weight, 0);
  return { score: clamp(100 - deduct), findings };
}

function countConsecutive<T>(arr: T[], target: T): { max: number } {
  let max = 0;
  let cur = 0;
  for (const v of arr) {
    if (v === target) {
      cur++;
      if (cur > max) max = cur;
    } else cur = 0;
  }
  return { max };
}

// ── Public entry ──────────────────────────────────────────────────────

export interface BrandInputs {
  primary?: string;
  secondary?: string;
  accent?: string;
}

export interface AnalyticsInputs {
  views?: number;
  clicks?: number;
}

export interface AnalyzeArgs {
  content: BioContent;
  brand?: BrandInputs;
  analytics?: AnalyticsInputs;
}

export function analyzePage({ content, brand = {}, analytics }: AnalyzeArgs): AnalysisReport {
  const theme = content.theme ?? DEFAULT_THEME;
  const design = analyzeDesign(content, theme);
  const brandCat = analyzeBrand(theme, brand);
  const a11y = analyzeAccessibility(theme);
  const cta = analyzeCta(content, theme);
  const layout = analyzeLayout(content);
  const conversion = analyzeConversion(content, analytics);

  // Weighted overall — a11y & CTA matter most for conversion.
  const overall = clamp(
    design.score * 0.2 +
      brandCat.score * 0.15 +
      a11y.score * 0.2 +
      cta.score * 0.2 +
      layout.score * 0.1 +
      conversion.score * 0.15,
  );

  const blocks = content.blocks ?? [];
  return {
    overall: Math.round(overall),
    design,
    brand: brandCat,
    accessibility: a11y,
    cta,
    layout,
    conversion,
    meta: {
      blockCount: blocks.length,
      buttonCount: blocks.filter((b) => b.type === "button" || b.type === "buttonGroup").length,
      imageCount: blocks.filter((b) => b.type === "image" || b.type === "gallery").length,
      hasProfile: blocks.some((b) => b.type === "profile"),
    },
  };
}
