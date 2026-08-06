/**
 * Template Library types.
 *
 * A template is a portable design bundle: a full theme, an optional
 * starter set of blocks, plus tier + layout metadata that drive the
 * premium marketplace UI and access control.
 */

import type { PageTheme } from "@/features/builder/theme";
import type { Block } from "@/features/builder/types";

export type TemplateCategoryId =
  | "creator"
  | "business"
  | "minimal"
  | "luxury"
  | "modern"
  | "neon"
  | "glass"
  | "musician"
  | "photographer"
  | "fitness"
  | "coach"
  | "restaurant"
  | "cafe"
  | "fashion"
  | "beauty"
  | "realestate"
  | "agency"
  | "consultant"
  | "developer"
  | "designer"
  | "writer"
  | "podcaster"
  | "influencer"
  | "nonprofit"
  | "event"
  | "wedding"
  | "portfolio"
  | "startup"
  | "ecommerce"
  | "education"
  | "travel"
  | "gaming"
  | "ai"
  | "corporate"
  | "personal"
  | "doctor"
  | "freelancer"
  | "lawyer"
  | "ca"
  | "salon"
  | "gym"
  | "student"
  | "digital-products";

export interface TemplateCategory {
  id: TemplateCategoryId;
  label: string;
}

export type TemplateStyle = "light" | "dark" | "gradient" | "glass" | "neon";

/** Access tier controls who can apply a template. */
export type TemplateTier = "free" | "premium" | "enterprise";

/**
 * Visual layout family the preview + apply-flow uses. Each layout id
 * corresponds to a distinct hero + button + card composition, so themes
 * that share a layoutId still differ by tokens, typography and spacing.
 */
export type TemplateLayoutId =
  | "classic"
  | "apple"
  | "glass"
  | "neumorph"
  | "notion"
  | "linear"
  | "stripe"
  | "framer"
  | "portfolio"
  | "luxury"
  | "neon-cyber"
  | "terminal"
  | "magazine"
  | "bento"
  | "split-hero"
  | "story-card"
  | "editorial"
  | "gaming"
  | "corporate";

export interface TemplateFlags {
  isNew?: boolean;
  isTrending?: boolean;
  isFeatured?: boolean;
}

export interface Template {
  /** Stable id — kebab-case slug for built-ins, uuid-like for custom. */
  id: string;
  /** Schema version. Bump if the shape changes in an incompatible way. */
  version: 1;
  name: string;
  description?: string;
  category: TemplateCategoryId;
  tags?: string[];
  style?: TemplateStyle;
  /** New tier field — supersedes `isPremium` for gating. */
  tier?: TemplateTier;
  /** Kept for backwards compatibility with older custom templates. */
  isPremium?: boolean;
  /** True when the template was saved by the user (vs. built-in). */
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
  /** Layout renderer id — drives the preview composition. */
  layoutId?: TemplateLayoutId;
  /** Marketplace flags. */
  flags?: TemplateFlags;
  /** Marketplace popularity, 0..100 — sort key. */
  popularity?: number;
  /** The design bundle — required. */
  theme: PageTheme;
  /** Optional starter blocks (used by Import/Export & Apply-with-content). */
  blocks?: Block[];
}

/** Resolves the tier for a template, honoring legacy `isPremium`. */
export function templateTier(t: Template): TemplateTier {
  if (t.tier) return t.tier;
  return t.isPremium ? "premium" : "free";
}
