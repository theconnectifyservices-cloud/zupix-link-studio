/**
 * ZUPIX Link Studio — Global Theme Engine (LS-07A + LS-07B).
 *
 * The theme is a single source of truth for how a bio page looks:
 *   colors, typography, spacing, card, buttons, background, profile.
 *
 * It is stored in `bio_pages.content.theme` and turned into CSS custom
 * properties by `themeToCssVars`, which cascade to every block. Every
 * live change in the Design Studio patches this object; the preview
 * re-renders instantly because it reads the same store.
 *
 * Extension notes for future phases:
 *   - Add fields as optional; renderer defaults keep old pages working.
 *   - Presets should stay declarative (data-only) so templates can be
 *     exported/imported later.
 */

import type { CSSProperties } from "react";

export type ThemeMode = "light" | "dark" | "auto";

export interface ThemeColors {
  /** Page background (can be gradient string or plain color). */
  background: string;
  /** Solid fallback (used where a gradient can't apply). */
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
  /** LS-07B additions — optional for backwards compat. */
  icon?: string;
  link?: string;
}

export type TextTransform = "none" | "uppercase" | "capitalize" | "lowercase";

export interface ThemeTypography {
  fontFamily: string;
  headingFamily: string;
  buttonFamily: string;
  baseSize: number;       // px — body base
  lineHeight: number;     // unitless
  letterSpacing: number;  // em
  headingWeight: 400 | 500 | 600 | 700 | 800 | 900;
  bodyWeight: 300 | 400 | 500 | 600;
  /** LS-07B additions. */
  headingScale?: number;      // multiplier applied to heading sizes (default 1)
  buttonSize?: number;        // px, button label size (default 14)
  textTransform?: TextTransform;
  /** LS-07C — per-viewport font-size multipliers. Default 1. */
  mobileScale?: number;
  tabletScale?: number;
  desktopScale?: number;
}

export interface ThemeSpacing {
  pagePadding: number;
  pagePaddingY: number;
  blockGap: number;
  contentWidth: number;
  radius: number;
  /** LS-07C — per-viewport horizontal padding overrides. */
  pagePaddingMobile?: number;
  pagePaddingTablet?: number;
  pagePaddingDesktop?: number;
}

export interface ThemeCard {
  background: string;
  radius: number;
  border: string;
  shadow: string;
  opacity: number;
  /** LS-07B additions. */
  padding?: number;   // px, inner padding
  margin?: number;    // px, outer margin
}

// ── Buttons (LS-07B) ────────────────────────────────────────────────────

export type ButtonVariantId =
  | "filled" | "outline" | "soft" | "ghost" | "glass" | "gradient";
export type ButtonShapeId = "pill" | "rounded" | "square";
export type ButtonAlignId = "left" | "center" | "right" | "stretch";
export type IconPositionId = "left" | "right" | "none";

export interface ThemeButtons {
  variant: ButtonVariantId;
  shape: ButtonShapeId;
  height: number;          // px
  radius: number;          // px (ignored when shape=pill)
  paddingX: number;        // px horizontal padding
  border: number;          // px border width
  shadow: string;          // css box-shadow
  iconPosition: IconPositionId;
  iconSize: number;        // px
  align: ButtonAlignId;
}

export const DEFAULT_BUTTONS: ThemeButtons = {
  variant: "filled",
  shape: "pill",
  height: 48,
  radius: 12,
  paddingX: 20,
  border: 1,
  shadow: "none",
  iconPosition: "left",
  iconSize: 16,
  align: "center",
};

// ── Background (LS-07B) ─────────────────────────────────────────────────

export type BackgroundKind =
  | "color" | "gradient" | "image" | "pattern" | "glass" | "video";
export type BackgroundSize = "cover" | "contain" | "auto";
export type BackgroundPosition =
  | "center" | "top" | "bottom" | "left" | "right"
  | "top left" | "top right" | "bottom left" | "bottom right";

export interface ThemeBackground {
  kind: BackgroundKind;
  imageUrl?: string;
  videoUrl?: string;       // architecture only — not rendered yet
  patternId?: string;      // key into BACKGROUND_PATTERNS
  size?: BackgroundSize;
  position?: BackgroundPosition;
  blur?: number;           // px, background blur
  overlay?: string;        // css overlay color (rgba)
  overlayOpacity?: number; // 0..1
  /** LS-07C — background effects. */
  noise?: boolean;
  noiseOpacity?: number;      // 0..1, default 0.08
  animatedGradient?: boolean; // shift gradient position over time
  meshGradient?: boolean;     // soft blurred radial mesh overlay
}

export const DEFAULT_BACKGROUND: ThemeBackground = {
  kind: "color",
  size: "cover",
  position: "center",
  blur: 0,
  overlay: "#000000",
  overlayOpacity: 0,
  noise: false,
  noiseOpacity: 0.08,
  animatedGradient: false,
  meshGradient: false,
};

/** Built-in SVG data-URI patterns — trusted, no external requests. */
export const BACKGROUND_PATTERNS: { id: string; label: string; url: string }[] = [
  { id: "dots", label: "Dots",
    url: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><circle cx='2' cy='2' r='1.2' fill='%23000' fill-opacity='0.15'/></svg>\")" },
  { id: "grid", label: "Grid",
    url: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='M24 0H0v24' fill='none' stroke='%23000' stroke-opacity='0.08'/></svg>\")" },
  { id: "diagonal", label: "Diagonal",
    url: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12'><path d='M0 12L12 0' stroke='%23000' stroke-opacity='0.08'/></svg>\")" },
  { id: "waves", label: "Waves",
    url: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='12'><path d='M0 6 Q10 0 20 6 T40 6' fill='none' stroke='%23000' stroke-opacity='0.1'/></svg>\")" },
];

// ── Profile (LS-07B) ────────────────────────────────────────────────────

export type AvatarShape = "circle" | "rounded" | "square";
export type AvatarSize = "sm" | "md" | "lg" | "xl";
export type BadgePosition = "inline" | "top-right" | "bottom-right";

export interface ThemeProfile {
  avatarShape: AvatarShape;
  avatarSize: AvatarSize;   // sm=64, md=80, lg=96, xl=128
  avatarBorderWidth: number; // px
  avatarBorderColor: string;
  coverHeight: number;       // px
  nameWeight: 400 | 500 | 600 | 700 | 800 | 900;
  nameSize: number;          // px
  bioSize: number;           // px
  bioWeight: 300 | 400 | 500 | 600;
  verifiedPosition: BadgePosition;
  /** LS-07C — profile effects. */
  avatarGlow?: boolean;
  avatarRing?: boolean;      // solid outer ring
  avatarRotatingRing?: boolean; // conic-gradient rotating ring
  avatarFloating?: boolean;  // gentle float animation
  badgeAnimation?: boolean;  // pulse the verified badge
}

export const DEFAULT_PROFILE: ThemeProfile = {
  avatarShape: "circle",
  avatarSize: "md",
  avatarBorderWidth: 4,
  avatarBorderColor: "#ffffff",
  coverHeight: 96,
  nameWeight: 700,
  nameSize: 18,
  bioSize: 12,
  bioWeight: 400,
  verifiedPosition: "inline",
  avatarGlow: false,
  avatarRing: false,
  avatarRotatingRing: false,
  avatarFloating: false,
  badgeAnimation: false,
};

const AVATAR_PX: Record<AvatarSize, number> = { sm: 64, md: 80, lg: 96, xl: 128 };
const AVATAR_RADIUS: Record<AvatarShape, string> = {
  circle: "9999px", rounded: "20px", square: "6px",
};

export type ThemePresetId =
  | "minimal" | "creator" | "business" | "luxury" | "neon" | "glass" | "modern";

// ── Motion (LS-07C) ─────────────────────────────────────────────────────

export type PageTransition = "none" | "fade" | "slide" | "scale";

export interface ThemeMotion {
  /** Force-disable all animations regardless of user preference. */
  reduce?: boolean;
  /** Container-level entrance played when the page mounts. */
  pageTransition?: PageTransition;
  /** Stagger block entrance animations. */
  stagger?: boolean;
  /** ms between successive block entrances when stagger is on. */
  staggerStep?: number;
}

export const DEFAULT_MOTION: ThemeMotion = {
  reduce: false,
  pageTransition: "fade",
  stagger: true,
  staggerStep: 60,
};

export interface PageTheme {
  mode: ThemeMode;
  preset: ThemePresetId | "custom";
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  card: ThemeCard;
  /** LS-07B additions — optional so old pages upgrade cleanly. */
  buttons?: ThemeButtons;
  background?: ThemeBackground;
  profile?: ThemeProfile;
  brandColors?: string[]; // saved swatches
  googleFonts?: string[]; // families to preload via <link>
  /** LS-07C additions. */
  motion?: ThemeMotion;
}

// ── Defaults ────────────────────────────────────────────────────────────

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
  icon: "#0b0b0f",
  link: "#2563eb",
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
  icon: "#f6f6f7",
  link: "#93c5fd",
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
  headingScale: 1,
  buttonSize: 14,
  textTransform: "none",
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
  padding: 12,
  margin: 0,
};

export const DEFAULT_THEME: PageTheme = {
  mode: "light",
  preset: "minimal",
  colors: DEFAULT_COLORS_LIGHT,
  typography: DEFAULT_TYPOGRAPHY,
  spacing: DEFAULT_SPACING,
  card: DEFAULT_CARD,
  buttons: DEFAULT_BUTTONS,
  background: DEFAULT_BACKGROUND,
  profile: DEFAULT_PROFILE,
  brandColors: [],
  googleFonts: [],
  motion: DEFAULT_MOTION,
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
  id: "minimal", label: "Minimal",
  description: "Clean, monochrome, editorial.", mode: "light",
  theme: { ...DEFAULT_THEME },
};

const PRESET_CREATOR: ThemePreset = {
  id: "creator", label: "Creator",
  description: "Warm gradient background, expressive.", mode: "light",
  theme: {
    ...DEFAULT_THEME,
    mode: "light",
    colors: { ...DEFAULT_COLORS_LIGHT,
      background: "linear-gradient(180deg,#ffd5c2 0%,#ffe8d6 45%,#fff5ea 100%)",
      backgroundSolid: "#ffe8d6",
      surface: "#fff5ea", card: "#ffffff",
      text: "#2b1a12", textMuted: "#7b5a48", border: "#f4d9c4",
      primary: "#ff5a5f", primaryText: "#ffffff",
      secondary: "#ffe0d0", secondaryText: "#2b1a12",
      accent: "#ff9f1c", icon: "#ff5a5f", link: "#ff5a5f",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 800 },
    spacing: { ...DEFAULT_SPACING, radius: 18, blockGap: 10 },
    card: { ...DEFAULT_CARD, radius: 18, border: "1px solid #f4d9c4",
      shadow: "0 6px 20px -12px rgba(255,90,95,0.35)" },
    buttons: { ...DEFAULT_BUTTONS, variant: "gradient", shape: "pill", height: 52 },
  },
};

const PRESET_BUSINESS: ThemePreset = {
  id: "business", label: "Business",
  description: "Corporate navy, structured.", mode: "light",
  theme: {
    ...DEFAULT_THEME,
    mode: "light",
    colors: { ...DEFAULT_COLORS_LIGHT,
      background: "#f4f6fb", backgroundSolid: "#f4f6fb",
      surface: "#ffffff", card: "#ffffff",
      text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0",
      primary: "#0f2e5c", primaryText: "#ffffff",
      secondary: "#e2e8f0", secondaryText: "#0f2e5c",
      accent: "#0ea5e9", icon: "#0f2e5c", link: "#0ea5e9",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 600 },
    spacing: { ...DEFAULT_SPACING, radius: 8, blockGap: 12 },
    card: { ...DEFAULT_CARD, radius: 8, border: "1px solid #e2e8f0",
      shadow: "0 1px 3px rgba(15,46,92,0.06)" },
    buttons: { ...DEFAULT_BUTTONS, variant: "filled", shape: "rounded", radius: 8, height: 44 },
  },
};

const PRESET_LUXURY: ThemePreset = {
  id: "luxury", label: "Luxury",
  description: "Deep black with gold accents.", mode: "dark",
  theme: {
    ...DEFAULT_THEME,
    mode: "dark",
    colors: { ...DEFAULT_COLORS_DARK,
      background: "#0a0a0a", backgroundSolid: "#0a0a0a",
      surface: "#141414", card: "#161616",
      text: "#f5f2ea", textMuted: "#a29a86", border: "#2a2620",
      primary: "#c9a24c", primaryText: "#0a0a0a",
      secondary: "#1c1a15", secondaryText: "#f5f2ea",
      accent: "#e8c98a", icon: "#c9a24c", link: "#e8c98a",
    },
    typography: { ...DEFAULT_TYPOGRAPHY,
      fontFamily: '"Cormorant Garamond", Georgia, serif',
      headingFamily: '"Cormorant Garamond", Georgia, serif',
      headingWeight: 600, letterSpacing: 0.02 },
    spacing: { ...DEFAULT_SPACING, radius: 4, blockGap: 14 },
    card: { ...DEFAULT_CARD, background: "#161616", radius: 4,
      border: "1px solid #2a2620",
      shadow: "0 8px 24px -12px rgba(201,162,76,0.15)" },
    buttons: { ...DEFAULT_BUTTONS, variant: "outline", shape: "square",
      radius: 2, height: 48, border: 1 },
  },
};

const PRESET_NEON: ThemePreset = {
  id: "neon", label: "Neon",
  description: "Cyberpunk, glowing accents.", mode: "dark",
  theme: {
    ...DEFAULT_THEME,
    mode: "dark",
    colors: { ...DEFAULT_COLORS_DARK,
      background: "radial-gradient(circle at 30% 20%,#3d0066 0%,#0a0018 55%,#000 100%)",
      backgroundSolid: "#0a0018",
      surface: "#150029", card: "#1a0033",
      text: "#f6f0ff", textMuted: "#a58bd9", border: "#3a1466",
      primary: "#ff3cac", primaryText: "#ffffff",
      secondary: "#28004d", secondaryText: "#f6f0ff",
      accent: "#00e5ff", icon: "#00e5ff", link: "#00e5ff",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 800 },
    spacing: { ...DEFAULT_SPACING, radius: 20, blockGap: 10 },
    card: { ...DEFAULT_CARD, background: "rgba(26,0,51,0.7)", radius: 20,
      border: "1px solid rgba(255,60,172,0.35)",
      shadow: "0 0 32px -8px rgba(255,60,172,0.45)", opacity: 0.9 },
    buttons: { ...DEFAULT_BUTTONS, variant: "gradient", shape: "pill",
      shadow: "0 0 20px -2px rgba(255,60,172,0.55)", height: 50 },
  },
};

const PRESET_GLASS: ThemePreset = {
  id: "glass", label: "Glass",
  description: "Frosted glass on soft gradient.", mode: "light",
  theme: {
    ...DEFAULT_THEME,
    mode: "light",
    colors: { ...DEFAULT_COLORS_LIGHT,
      background: "linear-gradient(135deg,#a5b4fc 0%,#c4b5fd 50%,#f0abfc 100%)",
      backgroundSolid: "#c4b5fd",
      surface: "rgba(255,255,255,0.55)",
      card: "rgba(255,255,255,0.55)",
      text: "#1e1b4b", textMuted: "#4c4a6a",
      border: "rgba(255,255,255,0.65)",
      primary: "#1e1b4b", primaryText: "#ffffff",
      secondary: "rgba(255,255,255,0.55)", secondaryText: "#1e1b4b",
      accent: "#7c3aed", icon: "#1e1b4b", link: "#7c3aed",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 700 },
    spacing: { ...DEFAULT_SPACING, radius: 20, blockGap: 12 },
    card: { ...DEFAULT_CARD, background: "rgba(255,255,255,0.5)", radius: 20,
      border: "1px solid rgba(255,255,255,0.6)",
      shadow: "0 8px 32px -8px rgba(31,27,75,0.18)", opacity: 0.85 },
    background: { ...DEFAULT_BACKGROUND, kind: "glass", blur: 10 },
    buttons: { ...DEFAULT_BUTTONS, variant: "glass", shape: "pill", height: 50 },
  },
};

const PRESET_MODERN: ThemePreset = {
  id: "modern", label: "Modern",
  description: "Bold indigo on cool white.", mode: "light",
  theme: {
    ...DEFAULT_THEME,
    mode: "light",
    colors: { ...DEFAULT_COLORS_LIGHT,
      background: "#fafafa", backgroundSolid: "#fafafa",
      surface: "#ffffff", card: "#ffffff",
      text: "#0b1220", textMuted: "#5b6478", border: "#e5e7eb",
      primary: "#4f46e5", primaryText: "#ffffff",
      secondary: "#eef2ff", secondaryText: "#4f46e5",
      accent: "#22d3ee", icon: "#4f46e5", link: "#4f46e5",
    },
    typography: { ...DEFAULT_TYPOGRAPHY, headingWeight: 700 },
    spacing: { ...DEFAULT_SPACING, radius: 14, blockGap: 10 },
    card: { ...DEFAULT_CARD, radius: 14, border: "1px solid #e5e7eb",
      shadow: "0 4px 14px -8px rgba(79,70,229,0.25)" },
    buttons: { ...DEFAULT_BUTTONS, variant: "filled", shape: "rounded",
      radius: 14, height: 48 },
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
export function resetButtons(current: PageTheme): PageTheme {
  return { ...current, buttons: { ...DEFAULT_BUTTONS }, preset: "custom" };
}
export function resetBackground(current: PageTheme): PageTheme {
  return { ...current, background: { ...DEFAULT_BACKGROUND }, preset: "custom" };
}
export function resetProfile(current: PageTheme): PageTheme {
  return { ...current, profile: { ...DEFAULT_PROFILE }, preset: "custom" };
}
export function resetMotion(current: PageTheme): PageTheme {
  return { ...current, motion: { ...DEFAULT_MOTION }, preset: "custom" };
}

// ── Google Fonts loader ─────────────────────────────────────────────────

const LOADED_FONTS = new Set<string>();

/**
 * Adds a Google Fonts <link> for `family` once per session. Family should
 * be the plain name (e.g. "Playfair Display"); weights are pre-selected
 * to cover typical needs.
 */
export function ensureGoogleFont(family: string) {
  if (!family || typeof document === "undefined") return;
  if (LOADED_FONTS.has(family)) return;
  LOADED_FONTS.add(family);
  const enc = family.replace(/\s+/g, "+");
  const href = `https://fonts.googleapis.com/css2?family=${enc}:wght@300;400;500;600;700;800;900&display=swap`;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute("data-zx-font", family);
  document.head.appendChild(link);
}

export const GOOGLE_FONTS: string[] = [
  "Inter", "Manrope", "Poppins", "DM Sans", "Space Grotesk",
  "Playfair Display", "Cormorant Garamond", "Lora",
  "JetBrains Mono", "Fira Code",
  "Bebas Neue", "Anton", "Archivo", "Outfit", "Sora", "Plus Jakarta Sans",
];

// ── Button variant → CSS ────────────────────────────────────────────────

function buttonVariantCss(theme: PageTheme): {
  background: string; color: string; border: string; extra: string;
} {
  const b = theme.buttons ?? DEFAULT_BUTTONS;
  const c = theme.colors;
  switch (b.variant) {
    case "filled":
      return { background: c.primary, color: c.primaryText,
        border: `${b.border}px solid transparent`, extra: "" };
    case "outline":
      return { background: "transparent", color: c.primary,
        border: `${b.border}px solid ${c.primary}`, extra: "" };
    case "soft":
      return { background: c.secondary, color: c.secondaryText,
        border: `${b.border}px solid transparent`, extra: "" };
    case "ghost":
      return { background: "transparent", color: c.primary,
        border: `${b.border}px solid transparent`, extra: "" };
    case "glass":
      return { background: "rgba(255,255,255,0.18)", color: c.text,
        border: `${b.border}px solid rgba(255,255,255,0.35)`,
        extra: "backdrop-filter:blur(14px) saturate(140%);" };
    case "gradient":
      return {
        background: `linear-gradient(135deg, ${c.primary}, ${c.accent})`,
        color: c.primaryText,
        border: `${b.border}px solid transparent`, extra: "" };
  }
}

// ── CSS variable generator ──────────────────────────────────────────────

import type { Viewport } from "./types";

/** Class names for background effects applied on the preview root. */
export function bgEffectClasses(theme: PageTheme): string[] {
  const bg = theme.background;
  if (!bg) return [];
  const cls: string[] = [];
  if (bg.noise) cls.push("zx-bg-noise");
  if (bg.animatedGradient && (bg.kind === "color" || bg.kind === "gradient")) {
    cls.push("zx-bg-animated-gradient");
  }
  if (bg.meshGradient) cls.push("zx-bg-mesh");
  return cls;
}

/** Class name for the container-level page transition. */
export function pageTransitionClass(theme: PageTheme): string | null {
  const t = theme.motion?.pageTransition ?? DEFAULT_MOTION.pageTransition;
  if (!t || t === "none") return null;
  return `zx-page-${t}`;
}

/**
 * Turns a PageTheme into a `style` object that overrides Tailwind tokens
 * and adds ZUPIX-specific tokens. Placed on the preview root, it cascades
 * to every block instantly.
 *
 * `viewport` (LS-07C) picks per-viewport typography scale and page padding.
 */
export function themeToCssVars(
  theme: PageTheme,
  viewport: Viewport = "mobile",
): CSSProperties {
  const c = theme.colors;
  const t = theme.typography;
  const s = theme.spacing;
  const card = theme.card;
  const bg = theme.background ?? DEFAULT_BACKGROUND;
  const btn = theme.buttons ?? DEFAULT_BUTTONS;
  const prof = theme.profile ?? DEFAULT_PROFILE;
  const btnCss = buttonVariantCss(theme);

  // Per-viewport font scale + page padding
  const fontScale =
    (viewport === "mobile"
      ? t.mobileScale
      : viewport === "tablet"
        ? t.tabletScale
        : t.desktopScale) ?? 1;
  const padX =
    (viewport === "mobile"
      ? s.pagePaddingMobile
      : viewport === "tablet"
        ? s.pagePaddingTablet
        : s.pagePaddingDesktop) ?? s.pagePadding;

  // Resolve final background — image/pattern override the colors.background
  let finalBg = c.background;
  let backgroundImage = "";
  if (bg.kind === "image" && bg.imageUrl) {
    finalBg = c.backgroundSolid;
    backgroundImage = `url("${bg.imageUrl}")`;
  } else if (bg.kind === "pattern" && bg.patternId) {
    const p = BACKGROUND_PATTERNS.find((x) => x.id === bg.patternId);
    if (p) {
      finalBg = c.backgroundSolid;
      backgroundImage = p.url;
    }
  }

  const vars: Record<string, string> = {
    // Override Tailwind semantic tokens
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

    // ZUPIX-namespaced tokens
    "--zx-bg": c.background,
    "--zx-surface": c.surface,
    "--zx-icon": c.icon ?? c.text,
    "--zx-link": c.link ?? c.accent,

    // Card
    "--zx-card-bg": card.background,
    "--zx-card-radius": `${card.radius}px`,
    "--zx-card-border": card.border,
    "--zx-card-shadow": card.shadow,
    "--zx-card-opacity": String(card.opacity),
    "--zx-card-pad": `${card.padding ?? 12}px`,
    "--zx-card-margin": `${card.margin ?? 0}px`,

    // Layout (per-viewport)
    "--zx-page-pad-x": `${padX}px`,
    "--zx-page-pad-y": `${s.pagePaddingY}px`,
    "--zx-block-gap": `${s.blockGap}px`,
    "--zx-content-max": `${s.contentWidth}px`,

    // Typography
    "--zx-heading-family": t.headingFamily,
    "--zx-button-family": t.buttonFamily,
    "--zx-heading-weight": String(t.headingWeight),
    "--zx-heading-scale": String((t.headingScale ?? 1) * fontScale),
    "--zx-text-transform": t.textTransform ?? "none",
    "--zx-font-scale": String(fontScale),

    // Buttons
    "--zx-btn-bg": btnCss.background,
    "--zx-btn-fg": btnCss.color,
    "--zx-btn-border": btnCss.border,
    "--zx-btn-radius": btn.shape === "pill" ? "9999px"
      : btn.shape === "square" ? "4px" : `${btn.radius}px`,
    "--zx-btn-h": `${btn.height}px`,
    "--zx-btn-px": `${btn.paddingX}px`,
    "--zx-btn-shadow": btn.shadow,
    "--zx-btn-font": t.buttonFamily,
    "--zx-btn-size": `${t.buttonSize ?? 14}px`,
    "--zx-btn-extra": btnCss.extra,

    // Profile
    "--zx-avatar-size": `${AVATAR_PX[prof.avatarSize]}px`,
    "--zx-avatar-radius": AVATAR_RADIUS[prof.avatarShape],
    "--zx-avatar-border-w": `${prof.avatarBorderWidth}px`,
    "--zx-avatar-border-c": prof.avatarBorderColor,
    "--zx-avatar-glow-c": c.primary,
    "--zx-avatar-ring-c": prof.avatarBorderColor || c.primary,
    "--zx-cover-h": `${prof.coverHeight}px`,
    "--zx-name-size": `${prof.nameSize * fontScale}px`,
    "--zx-name-weight": String(prof.nameWeight),
    "--zx-bio-size": `${prof.bioSize * fontScale}px`,
    "--zx-bio-weight": String(prof.bioWeight),

    // Background noise strength
    "--zx-bg-noise-op": String(bg.noiseOpacity ?? 0.08),
  };

  const style: CSSProperties = {
    ...(vars as CSSProperties),
    background: finalBg,
    color: c.text,
    fontFamily: t.fontFamily,
    fontSize: `${t.baseSize * fontScale}px`,
    lineHeight: t.lineHeight,
    letterSpacing: `${t.letterSpacing}em`,
    fontWeight: t.bodyWeight,
    position: "relative",
  };
  if (backgroundImage) {
    style.backgroundImage = backgroundImage;
    style.backgroundSize = bg.size ?? "cover";
    style.backgroundPosition = bg.position ?? "center";
    style.backgroundRepeat = bg.kind === "pattern" ? "repeat" : "no-repeat";
  }
  return style;
}

/** Resolve auto → light/dark using the browser preference. */
export function resolveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "auto") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
