/**
 * ZUPIX Link Studio — Global Theme Engine.
 *
 * A PageTheme is stored inside `bio_pages.content.theme` (JSONB) alongside
 * the block list. The renderer converts it into a set of CSS custom
 * properties which override the app-wide Tailwind tokens (`--background`,
 * `--foreground`, `--primary`, `--card`, …) — so every block that uses
 * `bg-background` / `text-foreground` / `bg-primary` automatically inherits
 * the current theme and updates live.
 *
 * Architecture notes:
 * - Presets are declarative. Applying a preset merges its values on top of
 *   defaults; users can keep customizing afterwards.
 * - `mode` is per-page (light/dark/auto) and independent from the app theme.
 * - Extend by adding fields; consumers already spread with defaults.
 */

import type { CSSProperties } from "react";

export type ThemeMode = "light" | "dark" | "auto";

export interface ThemeColors {
  /** Page background (can be gradient string). */
  background: string;
  /** Solid fallback bg when `background` is a gradient. */
  backgroundSolid: string;
  surface: string;
  card: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;
  accent: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFamily: string;
  buttonFamily: string;
  baseSize: number;       // px — body base
  lineHeight: number;     // unitless
  letterSpacing: number;  // em
  headingWeight: 400 | 500 | 600 | 700 | 800 | 900;
  bodyWeight: 300 | 400 | 500 | 600;
}

export interface ThemeSpacing {
  pagePadding: number;   // px, horizontal
  pagePaddingY: number;  // px, vertical
  blockGap: number;      // px, gap between blocks
  contentWidth: number;  // px, max width
  radius: number;        // px, base radius token
}

export interface ThemeCard {
  background: string;
  radius: number;      // px
  border: string;      // css border shorthand ('none' | '1px solid #…')
  shadow: string;      // css box-shadow
  opacity: number;     // 0..1 backdrop transparency
}

export type ThemePresetId =
  | "minimal" | "creator" | "business" | "luxury" | "neon" | "glass" | "modern";

export interface PageTheme {
  mode: ThemeMode;
  preset: ThemePresetId | "custom";
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  card: ThemeCard;
}

// ── Defaults (Minimal light) ────────────────────────────────────────────

export const DEFAULT_COLORS_LIGHT: ThemeColors = {
  background: "#ffffff",
  backgroundSolid: "#ffffff",
  surface: "#f7f7f8",
  card: "#ffffff",
  text: "#0b0b0f",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  primary: "#0b0b0f",
  primaryText: "#ffffff",
  secondary: "#f1f5f9",
  secondaryText: "#0b0b0f",
  accent: "#3b82f6",
};

export const DEFAULT_COLORS_DARK: ThemeColors = {
  background: "#0a0a0f",
  backgroundSolid: "#0a0a0f",
  surface: "#131318",
  card: "#17171d",
  text: "#f6f6f7",
  textMuted: "#9ca3af",
  border: "#26262e",
  primary: "#ffffff",
  primaryText: "#0b0b0f",
  secondary: "#1e1e26",
  secondaryText: "#f6f6f7",
  accent: "#60a5fa",
};

export const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  headingFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  buttonFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  baseSize: 14,
  lineHeight: 1.5,
  letterSpacing: 0,
  headingWeight: 700,
  bodyWeight: 400,
};

export const DEFAULT_SPACING: ThemeSpacing = {
  pagePadding: 20,
  pagePaddingY: 40,
  blockGap: 8,
  contentWidth: 480,
  radius: 12,
};

export const DEFAULT_CARD: ThemeCard = {
  background: "#ffffff",
  radius: 12,
  border: "1px solid #e5e7eb",
  shadow: "0 1px 2px rgba(0,0,0,0.04)",
  opacity: 1,
};

export const DEFAULT_THEME: PageTheme = {
  mode: "light",
  preset: "minimal",
  colors: DEFAULT_COLORS_LIGHT,
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  card: DEFAULT_CARD,
};

// ── Presets ─────────────────────────────────────────────────────────────

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  description: string;
  mode: ThemeMode;
  theme: Omit<PageTheme, "preset">;
}

const PRESET_MINIMAL: ThemePreset = {
  id: "minimal",
  label: "Minimal",
  description: "Clean, monochrome, editorial.",
  mode: "light",
  theme: { ...DEFAULT_THEME },
};

const PRESET_CREATOR: ThemePreset = {
  id: "creator",
  label: "Creator",
  description: "Warm gradient background, expressive.",
  mode: "light",
  theme: {
    mode: "light",
    colors: {
      background: "linear-gradient(180deg,#ffd5c2 0%,#ffe8d6 45%,#fff5ea 100%)",
      backgroundSolid: "#ffe8d6",
      surface: "#fff5ea",
      card: "#ffffff",
      text: "#2b1a12",
      textMuted: "#7b5a48",
      border: "#f4d9c4",
      primary: "#ff5a5f",
      primaryText: "#ffffff",
      secondary: "#ffe0d0",
      secondaryText: "#2b1a12",
      accent: "#ff9f1c",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 800 },
    spacing: { ...DEFAULT_SPACING, radius: 18, blockGap: 10 },
    card: { background: "#ffffff", radius: 18, border: "1px solid #f4d9c4",
      shadow: "0 6px 20px -12px rgba(255,90,95,0.35)", opacity: 1 },
  },
};

const PRESET_BUSINESS: ThemePreset = {
  id: "business",
  label: "Business",
  description: "Corporate navy, structured.",
  mode: "light",
  theme: {
    mode: "light",
    colors: {
      background: "#f4f6fb",
      backgroundSolid: "#f4f6fb",
      surface: "#ffffff",
      card: "#ffffff",
      text: "#0f172a",
      textMuted: "#64748b",
      border: "#e2e8f0",
      primary: "#0f2e5c",
      primaryText: "#ffffff",
      secondary: "#e2e8f0",
      secondaryText: "#0f2e5c",
      accent: "#0ea5e9",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 600, baseSize: 14 },
    spacing: { ...DEFAULT_SPACING, radius: 8, blockGap: 12 },
    card: { background: "#ffffff", radius: 8, border: "1px solid #e2e8f0",
      shadow: "0 1px 3px rgba(15,46,92,0.06)", opacity: 1 },
  },
};

const PRESET_LUXURY: ThemePreset = {
  id: "luxury",
  label: "Luxury",
  description: "Deep black with gold accents.",
  mode: "dark",
  theme: {
    mode: "dark",
    colors: {
      background: "#0a0a0a",
      backgroundSolid: "#0a0a0a",
      surface: "#141414",
      card: "#161616",
      text: "#f5f2ea",
      textMuted: "#a29a86",
      border: "#2a2620",
      primary: "#c9a24c",
      primaryText: "#0a0a0a",
      secondary: "#1c1a15",
      secondaryText: "#f5f2ea",
      accent: "#e8c98a",
    },
    typography: { ...DEFAULT_TYPOGRAPHY,
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      headingFamily: '"Cormorant Garamond", Georgia, serif',
      headingWeight: 600, letterSpacing: 0.02 },
    spacing: { ...DEFAULT_SPACING, radius: 4, blockGap: 14 },
    card: { background: "#161616", radius: 4, border: "1px solid #2a2620",
      shadow: "0 8px 24px -12px rgba(201,162,76,0.15)", opacity: 1 },
  },
};

const PRESET_NEON: ThemePreset = {
  id: "neon",
  label: "Neon",
  description: "Cyberpunk, glowing accents.",
  mode: "dark",
  theme: {
    mode: "dark",
    colors: {
      background: "radial-gradient(circle at 30% 20%,#3d0066 0%,#0a0018 55%,#000 100%)",
      backgroundSolid: "#0a0018",
      surface: "#150029",
      card: "#1a0033",
      text: "#f6f0ff",
      textMuted: "#a58bd9",
      border: "#3a1466",
      primary: "#ff3cac",
      primaryText: "#ffffff",
      secondary: "#28004d",
      secondaryText: "#f6f0ff",
      accent: "#00e5ff",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 800 },
    spacing: { ...DEFAULT_SPACING, radius: 20, blockGap: 10 },
    card: { background: "rgba(26,0,51,0.7)", radius: 20,
      border: "1px solid rgba(255,60,172,0.35)",
      shadow: "0 0 32px -8px rgba(255,60,172,0.45)", opacity: 0.9 },
  },
};

const PRESET_GLASS: ThemePreset = {
  id: "glass",
  label: "Glass",
  description: "Frosted glass on soft gradient.",
  mode: "light",
  theme: {
    mode: "light",
    colors: {
      background: "linear-gradient(135deg,#a5b4fc 0%,#c4b5fd 50%,#f0abfc 100%)",
      backgroundSolid: "#c4b5fd",
      surface: "rgba(255,255,255,0.55)",
      card: "rgba(255,255,255,0.55)",
      text: "#1e1b4b",
      textMuted: "#4c4a6a",
      border: "rgba(255,255,255,0.65)",
      primary: "#1e1b4b",
      primaryText: "#ffffff",
      secondary: "rgba(255,255,255,0.55)",
      secondaryText: "#1e1b4b",
      accent: "#7c3aed",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 700 },
    spacing: { ...DEFAULT_SPACING, radius: 20, blockGap: 12 },
    card: { background: "rgba(255,255,255,0.5)", radius: 20,
      border: "1px solid rgba(255,255,255,0.6)",
      shadow: "0 8px 32px -8px rgba(31,27,75,0.18)", opacity: 0.85 },
  },
};

const PRESET_MODERN: ThemePreset = {
  id: "modern",
  label: "Modern",
  description: "Bold indigo on cool white.",
  mode: "light",
  theme: {
    mode: "light",
    colors: {
      background: "#fafafa",
      backgroundSolid: "#fafafa",
      surface: "#ffffff",
      card: "#ffffff",
      text: "#0b1220",
      textMuted: "#5b6478",
      border: "#e5e7eb",
      primary: "#4f46e5",
      primaryText: "#ffffff",
      secondary: "#eef2ff",
      secondaryText: "#4f46e5",
      accent: "#22d3ee",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 700 },
    spacing: { ...DEFAULT_SPACING, radius: 14, blockGap: 10 },
    card: { background: "#ffffff", radius: 14, border: "1px solid #e5e7eb",
      shadow: "0 4px 14px -8px rgba(79,70,229,0.25)", opacity: 1 },
  },
};

export const THEME_PRESETS: ThemePreset[] = [
  PRESET_MINIMAL, PRESET_CREATOR, PRESET_BUSINESS,
  PRESET_LUXURY, PRESET_NEON, PRESET_GLASS, PRESET_MODERN,
];

export function getPreset(id: ThemePresetId): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

export function applyPresetTheme(id: ThemePresetId): PageTheme {
  const p = getPreset(id);
  if (!p) return DEFAULT_THEME;
  return { ...p.theme, preset: id };
}

// ── Resets ──────────────────────────────────────────────────────────────

export function resetColors(current: PageTheme): PageTheme {
  const isDark = current.mode === "dark";
  return {
    ...current,
    colors: isDark ? { ...DEFAULT_COLORS_DARK } : { ...DEFAULT_COLORS_LIGHT },
    preset: "custom",
  };
}
export function resetTypography(current: PageTheme): PageTheme {
  return { ...current, typography: { ...DEFAULT_TYPOGRAPHY }, preset: "custom" };
}
export function resetSpacing(current: PageTheme): PageTheme {
  return { ...current, spacing: { ...DEFAULT_SPACING }, preset: "custom" };
}
export function resetCard(current: PageTheme): PageTheme {
  return { ...current, card: { ...DEFAULT_CARD }, preset: "custom" };
}

// ── CSS variable generator ──────────────────────────────────────────────

/**
 * Turns a PageTheme into a `style` object that overrides the app-wide
 * Tailwind tokens and adds ZUPIX-specific tokens. Placed on the preview
 * root, it cascades to every block instantly.
 */
export function themeToCssVars(theme: PageTheme): CSSProperties {
  const c = theme.colors;
  const t = theme.typography;
  const s = theme.spacing;
  const card = theme.card;
  const vars: Record<string, string> = {
    // Override Tailwind semantic tokens the block renderer already uses
    "--background": c.backgroundSolid,
    "--foreground": c.text,
    "--card": card.background,
    "--card-foreground": c.text,
    "--popover": card.background,
    "--popover-foreground": c.text,
    "--primary": c.primary,
    "--primary-foreground": c.primaryText,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryText,
    "--muted": c.surface,
    "--muted-foreground": c.textMuted,
    "--accent": c.accent,
    "--accent-foreground": c.primaryText,
    "--border": c.border,
    "--input": c.border,
    "--ring": c.accent,
    "--radius": `${s.radius}px`,

    // ZUPIX-namespaced tokens (usable by future blocks / themes)
    "--zx-bg": c.background,
    "--zx-surface": c.surface,
    "--zx-card-bg": card.background,
    "--zx-card-radius": `${card.radius}px`,
    "--zx-card-border": card.border,
    "--zx-card-shadow": card.shadow,
    "--zx-card-opacity": String(card.opacity),
    "--zx-page-pad-x": `${s.pagePadding}px`,
    "--zx-page-pad-y": `${s.pagePaddingY}px`,
    "--zx-block-gap": `${s.blockGap}px`,
    "--zx-content-max": `${s.contentWidth}px`,
    "--zx-heading-family": t.headingFamily,
    "--zx-button-family": t.buttonFamily,
    "--zx-heading-weight": String(t.headingWeight),
  };
  return {
    ...(vars as CSSProperties),
    background: c.background,
    color: c.text,
    fontFamily: t.fontFamily,
    fontSize: `${t.baseSize}px`,
    lineHeight: t.lineHeight,
    letterSpacing: `${t.letterSpacing}em`,
    fontWeight: t.bodyWeight,
  };
}

/** Resolve auto → light/dark using the browser preference. */
export function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "auto") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
