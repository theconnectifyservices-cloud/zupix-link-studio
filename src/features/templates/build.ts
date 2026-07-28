/**
 * Theme spec → Template builder.
 *
 * A spec is a compact declaration that names the base preset and layers
 * on token overrides so each of the 70 themes stays visually distinct
 * without duplicating full PageTheme objects.
 */

import {
  applyPresetTheme,
  DEFAULT_BUTTONS,
  DEFAULT_CARD,
  DEFAULT_PROFILE,
  DEFAULT_SPACING,
  DEFAULT_TYPOGRAPHY,
  type PageTheme,
  type ThemeButtons,
  type ThemeCard,
  type ThemeColors,
  type ThemeProfile,
  type ThemeSpacing,
  type ThemeTypography,
  type ThemePresetId,
} from "@/features/builder/theme";
import type {
  Template,
  TemplateCategoryId,
  TemplateFlags,
  TemplateLayoutId,
  TemplateStyle,
  TemplateTier,
} from "./types";

export interface ThemeSpec {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryId;
  tier: TemplateTier;
  layoutId: TemplateLayoutId;
  preset: ThemePresetId;
  style: TemplateStyle;
  tags?: string[];
  flags?: TemplateFlags;
  popularity?: number;
  colors?: Partial<ThemeColors>;
  typography?: Partial<ThemeTypography>;
  spacing?: Partial<ThemeSpacing>;
  card?: Partial<ThemeCard>;
  buttons?: Partial<ThemeButtons>;
  profile?: Partial<ThemeProfile>;
  googleFonts?: string[];
}

export function buildTemplateFromSpec(s: ThemeSpec): Template {
  const base = applyPresetTheme(s.preset);
  const theme: PageTheme = {
    ...base,
    preset: "custom",
    colors: { ...base.colors, ...(s.colors ?? {}) },
    typography: { ...DEFAULT_TYPOGRAPHY, ...base.typography, ...(s.typography ?? {}) },
    spacing: { ...DEFAULT_SPACING, ...base.spacing, ...(s.spacing ?? {}) },
    card: { ...DEFAULT_CARD, ...base.card, ...(s.card ?? {}) },
    buttons: { ...DEFAULT_BUTTONS, ...(base.buttons ?? {}), ...(s.buttons ?? {}) },
    profile: { ...DEFAULT_PROFILE, ...(base.profile ?? {}), ...(s.profile ?? {}) },
    googleFonts: [...(base.googleFonts ?? []), ...(s.googleFonts ?? [])],
  };
  return {
    id: s.id,
    version: 1,
    name: s.name,
    description: s.description,
    category: s.category,
    tags: s.tags,
    style: s.style,
    tier: s.tier,
    isPremium: s.tier !== "free",
    isCustom: false,
    layoutId: s.layoutId,
    flags: s.flags,
    popularity: s.popularity,
    theme,
  };
}
