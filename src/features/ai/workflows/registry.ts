/**
 * LS-12E — Workflow Registry.
 *
 * Declarative catalog of AI workflows the user can trigger. Each workflow
 * describes: what it needs, which safe action it produces, whether it
 * requires approval, and how it renders a preview. Handlers stay pure and
 * side-effect free — actual mutations happen in workflows/api.ts after
 * approval.
 */
import type { BioContent } from "@/features/builder/types";
import type { SeoSettings } from "@/features/seo/types";

export type WorkflowCategory =
  | "content"
  | "design"
  | "seo"
  | "growth"
  | "media"
  | "insights";

export type WorkflowTargetKind = "bio_page" | "workspace" | "asset";

export interface WorkflowTarget {
  kind: WorkflowTargetKind;
  id?: string;
}

export type SafeAction =
  | "update_bio_draft"
  | "create_content_draft"
  | "generate_cta_draft"
  | "generate_seo_draft"
  | "suggest_theme"
  | "generate_weekly_insights"
  | "flag_unused_assets";

export type TriggerType =
  | "manual"
  | "scheduled"
  | "analytics_change"
  | "conversion_drop"
  | "bio_published"
  | "asset_uploaded"
  | "template_applied";

export interface WorkflowDefinition {
  id: string;
  title: string;
  description: string;
  category: WorkflowCategory;
  icon: string; // lucide icon name
  targetKind: WorkflowTargetKind;
  safeAction: SafeAction;
  requiresApproval: boolean;
  supportedTriggers: TriggerType[];
  /** Roughly how long the run should take, for UI copy. */
  estimatedSeconds: number;
  /** What the preview payload will look like after generation. */
  previewShape: "bio_content" | "text" | "cta" | "seo" | "theme" | "report" | "asset_list";
  destructive: boolean;
}

export const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "optimize_bio",
    title: "Optimize Bio",
    description:
      "AI rewrites headline, subhead and top CTA using workspace brand memory. Produces a draft — nothing published.",
    category: "content",
    icon: "Sparkles",
    targetKind: "bio_page",
    safeAction: "update_bio_draft",
    requiresApproval: true,
    supportedTriggers: ["manual", "analytics_change", "bio_published"],
    estimatedSeconds: 20,
    previewShape: "bio_content",
    destructive: false,
  },
  {
    id: "improve_cta",
    title: "Improve CTA",
    description:
      "Rewrites your primary button copy for higher conversion. Preserves link URL.",
    category: "growth",
    icon: "Target",
    targetKind: "bio_page",
    safeAction: "generate_cta_draft",
    requiresApproval: true,
    supportedTriggers: ["manual", "conversion_drop"],
    estimatedSeconds: 10,
    previewShape: "cta",
    destructive: false,
  },
  {
    id: "generate_seo",
    title: "Generate SEO",
    description:
      "Fills page title, meta description, OpenGraph and Twitter fields. Saves as draft SEO settings.",
    category: "seo",
    icon: "Search",
    targetKind: "bio_page",
    safeAction: "generate_seo_draft",
    requiresApproval: true,
    supportedTriggers: ["manual", "bio_published"],
    estimatedSeconds: 15,
    previewShape: "seo",
    destructive: false,
  },
  {
    id: "create_social_content",
    title: "Create Social Content",
    description:
      "Generates on-brand social captions for Instagram, X and LinkedIn from the current bio.",
    category: "content",
    icon: "Share2",
    targetKind: "bio_page",
    safeAction: "create_content_draft",
    requiresApproval: false,
    supportedTriggers: ["manual", "bio_published"],
    estimatedSeconds: 15,
    previewShape: "text",
    destructive: false,
  },
  {
    id: "suggest_theme",
    title: "Suggest Theme",
    description:
      "Recommends a color/typography theme that matches your brand kit. Never applied automatically.",
    category: "design",
    icon: "Palette",
    targetKind: "bio_page",
    safeAction: "suggest_theme",
    requiresApproval: true,
    supportedTriggers: ["manual", "template_applied"],
    estimatedSeconds: 12,
    previewShape: "theme",
    destructive: false,
  },
  {
    id: "flag_unused_assets",
    title: "Flag Unused Assets",
    description:
      "Scans the media library for assets not referenced by any bio page and prepares a review list. Nothing is deleted.",
    category: "media",
    icon: "Archive",
    targetKind: "workspace",
    safeAction: "flag_unused_assets",
    requiresApproval: true,
    supportedTriggers: ["manual", "scheduled", "asset_uploaded"],
    estimatedSeconds: 8,
    previewShape: "asset_list",
    destructive: false,
  },
  {
    id: "weekly_report",
    title: "Generate Weekly Report",
    description:
      "Summarizes traffic, top pages, CTR changes and priority actions for the last 7 days.",
    category: "insights",
    icon: "TrendingUp",
    targetKind: "workspace",
    safeAction: "generate_weekly_insights",
    requiresApproval: false,
    supportedTriggers: ["manual", "scheduled"],
    estimatedSeconds: 25,
    previewShape: "report",
    destructive: false,
  },
];

export function findWorkflow(id: string): WorkflowDefinition | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}

// ── Preview payload types ─────────────────────────────────────────────

export interface BioDraftPreview {
  patches: { blockId: string; before: unknown; after: unknown }[];
  updatedContent: BioContent;
}

export interface CtaDraftPreview {
  blockId: string;
  before: { label: string; sublabel?: string };
  after: { label: string; sublabel?: string };
}

export interface SeoDraftPreview {
  before: SeoSettings;
  after: SeoSettings;
}

export interface ThemePreview {
  name: string;
  rationale: string;
  tokens: Record<string, string>;
}

export interface ReportPreview {
  title: string;
  summary: string;
  highlights: string[];
  actions: string[];
}

export interface AssetListPreview {
  assetIds: string[];
  count: number;
  totalBytes: number;
}
