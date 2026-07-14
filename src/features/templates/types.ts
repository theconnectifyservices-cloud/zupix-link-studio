/**
 * Template Library types (LS-07D).
 *
 * A template is a portable design bundle: a full theme, an optional
 * starter set of blocks, and enough metadata to browse/search it. The
 * shape is JSON-serializable so future phases can add import/export
 * and a marketplace without breaking older files.
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
  | "travel";

export interface TemplateCategory {
  id: TemplateCategoryId;
  label: string;
}

export type TemplateStyle = "light" | "dark" | "gradient" | "glass" | "neon";

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
  isPremium?: boolean;
  /** True when the template was saved by the user (vs. built-in). */
  isCustom?: boolean;
  createdAt?: number;
  updatedAt?: number;
  /** The design bundle — required. */
  theme: PageTheme;
  /** Optional starter blocks (used by Import/Export & Apply-with-content). */
  blocks?: Block[];
}
