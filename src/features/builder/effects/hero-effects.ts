/**
 * Hero Effects Engine v2.0 — Universal Effects System
 *
 * A reusable, GPU-accelerated animation engine for the Hero/Profile block
 * (and future blocks: buttons, cards, images, gallery, testimonials, etc.).
 *
 * Design principles
 * - CSS-first: uses transform + opacity + CSS variables. No layout reflow.
 * - Declarative: all effects are pure derivations of `HeroEffectsConfig`.
 * - Reduced motion: `prefers-reduced-motion` disables all animations.
 * - Deterministic: same config → same rendered classes / CSS variables.
 */

import type { CSSProperties } from "react";

/* ─────────────────────────── Effect enums ─────────────────────────── */

export type AvatarEffect =
  | "none"
  | "glow"
  | "floating"
  | "pulse"
  | "breathing"
  | "bounce"
  | "neonGlow"
  | "shadowDepth"
  | "blurGlow"
  | "softFloating";

export type AvatarRingStyle =
  | "none"
  | "solid"
  | "gradient"
  | "neon"
  | "glass"
  | "double"
  | "dashed"
  | "animatedGradient";

export type RingAnimation =
  | "static"
  | "rotateCw"
  | "rotateCcw"
  | "pulse"
  | "expand"
  | "ripple";

export type BadgeEffect =
  | "static"
  | "pulse"
  | "glow"
  | "shine"
  | "bounce"
  | "blink"
  | "rotate"
  | "floating";

export type HeroCardEffect =
  | "none"
  | "glass"
  | "floating"
  | "borderGlow"
  | "animatedBorder"
  | "spotlight"
  | "shadowLift"
  | "gradientBorder"
  | "aurora";

export type HeroBgEffect =
  | "none"
  | "animatedGradient"
  | "aurora"
  | "meshGradient"
  | "particles"
  | "glassOverlay"
  | "blurOverlay"
  | "ambientGlow";

/* ─────────────────────────── Config shape ─────────────────────────── */

export interface HeroAvatarEffectConfig {
  effect?: AvatarEffect;
  color?: string; // glow color
  blur?: number; // px
  strength?: number; // 0..100
  spread?: number; // px
  speed?: number; // ms
  distance?: number; // px (floating/bounce)
  scale?: number; // pulse
  delay?: number; // ms
  opacity?: number; // 0..1
}

export interface HeroRingConfig {
  style?: AvatarRingStyle;
  animation?: RingAnimation;
  width?: number; // px
  color?: string;
  color2?: string; // gradient stop
  opacity?: number; // 0..1
  speed?: number; // ms rotation duration
  pauseOnHover?: boolean;
}

export interface HeroBadgeConfig {
  effect?: BadgeEffect;
  color?: string; // glow
  size?: number; // px override
  speed?: number; // ms
  rotation?: number; // static rotate deg
}

export interface HeroCardConfig {
  effect?: HeroCardEffect;
  shadow?: number; // 0..100
  glassBlur?: number; // px
  borderWidth?: number;
  borderRadius?: number;
  borderColor?: string;
  glowColor?: string;
  glowStrength?: number; // 0..100
  gradientSpeed?: number; // ms
}

export interface HeroBackgroundConfig {
  effect?: HeroBgEffect;
  speed?: number; // ms
  overlayColor?: string;
  overlayOpacity?: number; // 0..1
  blur?: number; // px
  brightness?: number; // %
  contrast?: number; // %
  color1?: string;
  color2?: string;
  color3?: string;
}

export interface HeroEffectsConfig {
  /** Master switch — false disables all effects. */
  enabled?: boolean;
  /** User-forced reduced-motion (in addition to prefers-reduced-motion). */
  reduceMotion?: boolean;
  avatar?: HeroAvatarEffectConfig;
  ring?: HeroRingConfig;
  badge?: HeroBadgeConfig;
  card?: HeroCardConfig;
  background?: HeroBackgroundConfig;
}

/* ─────────────────────────── Defaults ─────────────────────────── */

export const DEFAULT_HERO_EFFECTS: HeroEffectsConfig = {
  enabled: true,
  reduceMotion: false,
  avatar: {
    effect: "none",
    color: "#6366f1",
    blur: 24,
    strength: 60,
    spread: 4,
    speed: 3200,
    distance: 8,
    scale: 1.05,
    delay: 0,
    opacity: 1,
  },
  ring: {
    style: "none",
    animation: "static",
    width: 3,
    color: "#6366f1",
    color2: "#ec4899",
    opacity: 1,
    speed: 4000,
    pauseOnHover: false,
  },
  badge: {
    effect: "static",
    color: "#6366f1",
    speed: 1600,
    rotation: 0,
  },
  card: {
    effect: "none",
    shadow: 30,
    glassBlur: 16,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "rgba(255,255,255,0.2)",
    glowColor: "#6366f1",
    glowStrength: 40,
    gradientSpeed: 6000,
  },
  background: {
    effect: "none",
    speed: 8000,
    overlayColor: "rgba(0,0,0,0.3)",
    overlayOpacity: 0.35,
    blur: 0,
    brightness: 100,
    contrast: 100,
    color1: "#6366f1",
    color2: "#ec4899",
    color3: "#22d3ee",
  },
};

/* ─────────────────────────── Resolver ─────────────────────────── */

export interface ResolvedHeroEffects {
  avatarClass: string;
  ringClass: string;
  ringOverlayClass: string;
  badgeClass: string;
  cardClass: string;
  cardStyle: CSSProperties;
  bgOverlayClass: string;
  cssVars: CSSProperties;
  disabled: boolean;
}

const AVATAR_EFFECT_CLASS: Record<AvatarEffect, string> = {
  none: "",
  glow: "zx-hero-avatar--glow",
  floating: "zx-hero-avatar--floating",
  pulse: "zx-hero-avatar--pulse",
  breathing: "zx-hero-avatar--breathing",
  bounce: "zx-hero-avatar--bounce",
  neonGlow: "zx-hero-avatar--neon",
  shadowDepth: "zx-hero-avatar--shadow-depth",
  blurGlow: "zx-hero-avatar--blur-glow",
  softFloating: "zx-hero-avatar--soft-floating",
};

const RING_STYLE_CLASS: Record<AvatarRingStyle, string> = {
  none: "",
  solid: "zx-hero-ring--solid",
  gradient: "zx-hero-ring--gradient",
  neon: "zx-hero-ring--neon",
  glass: "zx-hero-ring--glass",
  double: "zx-hero-ring--double",
  dashed: "zx-hero-ring--dashed",
  animatedGradient: "zx-hero-ring--gradient zx-hero-ring--animated",
};

const RING_ANIM_CLASS: Record<RingAnimation, string> = {
  static: "",
  rotateCw: "zx-hero-ring--spin",
  rotateCcw: "zx-hero-ring--spin-rev",
  pulse: "zx-hero-ring--pulse",
  expand: "zx-hero-ring--expand",
  ripple: "zx-hero-ring--ripple",
};

const BADGE_EFFECT_CLASS: Record<BadgeEffect, string> = {
  static: "",
  pulse: "zx-hero-badge--pulse",
  glow: "zx-hero-badge--glow",
  shine: "zx-hero-badge--shine",
  bounce: "zx-hero-badge--bounce",
  blink: "zx-hero-badge--blink",
  rotate: "zx-hero-badge--rotate",
  floating: "zx-hero-badge--floating",
};

const CARD_EFFECT_CLASS: Record<HeroCardEffect, string> = {
  none: "",
  glass: "zx-hero-card--glass",
  floating: "zx-hero-card--floating",
  borderGlow: "zx-hero-card--border-glow",
  animatedBorder: "zx-hero-card--animated-border",
  spotlight: "zx-hero-card--spotlight",
  shadowLift: "zx-hero-card--shadow-lift",
  gradientBorder: "zx-hero-card--gradient-border",
  aurora: "zx-hero-card--aurora",
};

const BG_EFFECT_CLASS: Record<HeroBgEffect, string> = {
  none: "",
  animatedGradient: "zx-hero-bg--animated-gradient",
  aurora: "zx-hero-bg--aurora",
  meshGradient: "zx-hero-bg--mesh",
  particles: "zx-hero-bg--particles",
  glassOverlay: "zx-hero-bg--glass",
  blurOverlay: "zx-hero-bg--blur",
  ambientGlow: "zx-hero-bg--ambient",
};

/** Merge partial user config with defaults. */
export function mergeHeroEffects(cfg?: HeroEffectsConfig): HeroEffectsConfig {
  return {
    ...DEFAULT_HERO_EFFECTS,
    ...cfg,
    avatar: { ...DEFAULT_HERO_EFFECTS.avatar, ...cfg?.avatar },
    ring: { ...DEFAULT_HERO_EFFECTS.ring, ...cfg?.ring },
    badge: { ...DEFAULT_HERO_EFFECTS.badge, ...cfg?.badge },
    card: { ...DEFAULT_HERO_EFFECTS.card, ...cfg?.card },
    background: { ...DEFAULT_HERO_EFFECTS.background, ...cfg?.background },
  };
}

/**
 * Resolve a config into concrete classes + CSS variables.
 * Consumers spread `cssVars` on the outer wrapper.
 */
export function resolveHeroEffects(cfg?: HeroEffectsConfig): ResolvedHeroEffects {
  const merged = mergeHeroEffects(cfg);
  const disabled = merged.enabled === false || merged.reduceMotion === true;

  const a = merged.avatar!;
  const r = merged.ring!;
  const b = merged.badge!;
  const c = merged.card!;
  const bg = merged.background!;

  const avatarClass = disabled ? "" : (AVATAR_EFFECT_CLASS[a.effect ?? "none"] ?? "");
  const ringClass = disabled ? "" : (RING_STYLE_CLASS[r.style ?? "none"] ?? "");
  const ringOverlayClass = disabled
    ? ""
    : [RING_ANIM_CLASS[r.animation ?? "static"] ?? "", r.pauseOnHover ? "zx-hero-ring--pause-hover" : ""]
        .filter(Boolean)
        .join(" ");
  const badgeClass = disabled ? "" : (BADGE_EFFECT_CLASS[b.effect ?? "static"] ?? "");
  const cardClass = disabled ? "" : (CARD_EFFECT_CLASS[c.effect ?? "none"] ?? "");
  const bgOverlayClass = disabled ? "" : (BG_EFFECT_CLASS[bg.effect ?? "none"] ?? "");

  const cssVars = {
    // avatar
    "--zx-hero-avatar-color": a.color,
    "--zx-hero-avatar-blur": `${a.blur ?? 0}px`,
    "--zx-hero-avatar-strength": `${((a.strength ?? 60) / 100).toFixed(2)}`,
    "--zx-hero-avatar-spread": `${a.spread ?? 0}px`,
    "--zx-hero-avatar-speed": `${a.speed ?? 3000}ms`,
    "--zx-hero-avatar-distance": `${a.distance ?? 8}px`,
    "--zx-hero-avatar-scale": String(a.scale ?? 1.05),
    "--zx-hero-avatar-delay": `${a.delay ?? 0}ms`,
    "--zx-hero-avatar-opacity": String(a.opacity ?? 1),
    // ring
    "--zx-hero-ring-w": `${r.width ?? 3}px`,
    "--zx-hero-ring-c": r.color,
    "--zx-hero-ring-c2": r.color2,
    "--zx-hero-ring-opacity": String(r.opacity ?? 1),
    "--zx-hero-ring-speed": `${r.speed ?? 4000}ms`,
    // badge
    "--zx-hero-badge-color": b.color,
    "--zx-hero-badge-speed": `${b.speed ?? 1600}ms`,
    "--zx-hero-badge-rot": `${b.rotation ?? 0}deg`,
    // card
    "--zx-hero-card-shadow": `${((c.shadow ?? 30) / 100).toFixed(2)}`,
    "--zx-hero-card-glass-blur": `${c.glassBlur ?? 16}px`,
    "--zx-hero-card-border-w": `${c.borderWidth ?? 1}px`,
    "--zx-hero-card-radius": `${c.borderRadius ?? 20}px`,
    "--zx-hero-card-border-c": c.borderColor,
    "--zx-hero-card-glow-c": c.glowColor,
    "--zx-hero-card-glow-s": `${((c.glowStrength ?? 40) / 100).toFixed(2)}`,
    "--zx-hero-card-grad-speed": `${c.gradientSpeed ?? 6000}ms`,
    // bg
    "--zx-hero-bg-speed": `${bg.speed ?? 8000}ms`,
    "--zx-hero-bg-overlay": bg.overlayColor,
    "--zx-hero-bg-overlay-op": String(bg.overlayOpacity ?? 0.35),
    "--zx-hero-bg-blur": `${bg.blur ?? 0}px`,
    "--zx-hero-bg-brightness": `${bg.brightness ?? 100}%`,
    "--zx-hero-bg-contrast": `${bg.contrast ?? 100}%`,
    "--zx-hero-bg-c1": bg.color1,
    "--zx-hero-bg-c2": bg.color2,
    "--zx-hero-bg-c3": bg.color3,
  } as CSSProperties;

  const cardStyle: CSSProperties = {};
  if (!disabled && c.effect && c.effect !== "none") {
    cardStyle.borderRadius = `var(--zx-hero-card-radius)`;
  }

  return {
    avatarClass,
    ringClass,
    ringOverlayClass,
    badgeClass,
    cardClass,
    cardStyle,
    bgOverlayClass,
    cssVars,
    disabled,
  };
}
