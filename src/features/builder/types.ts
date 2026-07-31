/**
 * Builder block model.
 * Blocks are stored as JSON in `bio_pages.content`, so keep this shape
 * append-only compatible (new optional fields OK; renames are breaking).
 */
export type BlockType =
  | "profile"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "social"
  | "video"
  | "gallery"
  | "socialFeed"
  | "testimonials"
  | "faq"
  | "countdown"
  | "map"
  | "file"
  | "contact"
  | "buttonGroup"
  | "embed"
  | "customCode"
  // reserved for later phases
  | "html"
  | "form"
  | "store"
  | "booking";

/** Entrance animation played once as the block appears. */
export type EntranceAnim =
  | "none"
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "zoom-out"
  | "scale"
  | "slide-up"
  | "slide-down"
  | "rotate-in"
  | "flip"
  | "bounce";

/** Continuous hover effect applied on pointer-over. */
export type HoverEffect =
  | "none"
  | "lift"
  | "scale"
  | "glow"
  | "shadow"
  | "border"
  | "pulse"
  | "tilt"
  | "brightness"
  | "blur";

/** Rich effect layered onto button-like blocks. v2.0 library. */
export type ButtonEffect =
  | "none"
  | "shine"
  | "ripple"
  | "neon"
  | "floating"
  | "pulse"
  | "bounce"
  | "glow"
  | "gradientFlow"
  | "magnetic"
  | "glass"
  | "borderGlow"
  | "breathing"
  | "shake"
  | "floatingGlow"
  | "lift3d"
  | "liquidFill"
  | "rainbowBorder"
  | "spotlight"
  | "premiumCta"
  // legacy — kept for backward compatibility with saved pages
  | "expand"
  | "press";

/** Direction options for effects that sweep or fill. */
export type ButtonEffectDirection = "lr" | "rl" | "tb" | "bt" | "diag";


/** Per-viewport spacing / typography overrides. */
export interface ResponsiveOverrides {
  paddingX?: number;
  paddingY?: number;
  marginTop?: number;
  marginBottom?: number;
  /** Font size multiplier for scalable text inside the block. */
  fontScale?: number;
}

export type Viewport = "mobile" | "tablet" | "desktop";

/** Shared visual/behavior settings available on every advanced block. */
export interface BlockSettings {
  paddingY?: number; // px
  paddingX?: number; // px
  marginTop?: number; // px
  marginBottom?: number; // px
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  background?: string; // css color
  /** Entrance animation. Legacy "zoom" is normalized to "zoom-in" at render time. */
  animation?: EntranceAnim | "zoom";
  animationDuration?: number; // ms (default 600)
  animationDelay?: number; // ms (added on top of stagger)
  animationRepeat?: "once" | "infinite";
  hover?: HoverEffect;
  /** Only meaningful for button / buttonGroup blocks. */
  buttonEffect?: ButtonEffect;
  /** Trigger mode for Shine (default: hover). */
  buttonEffectMode?: "always" | "hover" | "click";
  /** Animation speed / duration in ms for continuous effects. */
  buttonEffectSpeed?: number;
  /** Delay before the animation starts, ms. */
  buttonEffectDelay?: number;
  /** Iteration count: "infinite" or a number. */
  buttonEffectRepeat?: "infinite" | number;
  /** Primary accent color (glow, ripple, neon, spotlight, liquid fill). */
  buttonEffectColor?: string;
  /** Secondary color (glass reflection tint, rainbow accent). */
  buttonEffectColor2?: string;
  /** Intensity 0-100 — maps to glow blur, magnetic pull strength, etc. */
  buttonEffectIntensity?: number;
  /** Direction for sweeping/filling effects. */
  buttonEffectDirection?: ButtonEffectDirection;
  /** Effect-specific "size" (shine width %, ripple max scale, spotlight radius px). */
  buttonEffectSize?: number;
  /** Effect-specific opacity 0-1 (ripple, glass). */
  buttonEffectOpacity?: number;
  /** Effect-specific distance in px (floating, bounce, shake, 3d lift). */
  buttonEffectDistance?: number;
  /** Effect-specific scale factor (pulse, breathing). */
  buttonEffectScale?: number;
  /** Gradient stops for Gradient Flow / Rainbow Border. */
  buttonEffectGradient?: string[];
  /** Master enable toggle — false disables all button effects for this block. */
  buttonEffectEnabled?: boolean;

  /** Per-viewport visibility. `undefined` = shown. */
  visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  /** Per-viewport spacing / typography overrides. */
  responsive?: Partial<Record<Viewport, ResponsiveOverrides>>;
  /**
   * Element-level font override (full CSS stack).
   * `undefined` = inherit the global theme typography.
   */
  fontFamily?: string;
}


export interface BaseBlock {
  id: string;
  type: BlockType;
  hidden?: boolean;
  locked?: boolean;
  name?: string;
  settings?: BlockSettings;
}

export type ProfileLayout = "left" | "center" | "right" | "stacked" | "split";
export type ProfileBgType = "none" | "solid" | "gradient" | "image" | "video" | "glass";
export type ProfileShadow = "none" | "sm" | "md" | "lg" | "xl";
export type ProfileRing = "none" | "solid" | "gradient" | "glow";
export type BadgePosition = "inline" | "top-right" | "bottom-right";

export interface ProfileBlock extends BaseBlock {
  type: "profile";
  avatarUrl?: string;
  coverUrl?: string;
  displayName: string;
  username?: string;
  bio?: string;
  location?: string;
  shortDescription?: string;
  verified?: boolean;

  /** Layout */
  layout?: ProfileLayout;

  /** Name typography */
  nameColor?: string;
  nameFontFamily?: string;
  nameFontSizePx?: number;
  nameFontWeight?: FontWeight;
  nameLetterSpacing?: number;
  nameLineHeight?: number;
  nameTextShadow?: string;

  /** Bio typography */
  bioColor?: string;
  bioFontFamily?: string;
  bioFontSizePx?: number;
  bioFontWeight?: FontWeight;
  bioLetterSpacing?: number;
  bioLineHeight?: number;
  bioMaxLines?: number;

  /** Verified badge */
  badgeColor?: string;
  badgeBgColor?: string;
  badgeBorderColor?: string;
  badgeSize?: number;
  badgePosition?: BadgePosition;

  /** Profile image */
  avatarSize?: number;
  avatarRadius?: number;
  avatarBorderWidth?: number;
  avatarBorderColor?: string;
  avatarShadow?: ProfileShadow;
  avatarRing?: ProfileRing;
  avatarRingColor?: string;
  avatarObjectFit?: "cover" | "contain";
  avatarZoom?: number;

  /** Hero background */
  bgType?: ProfileBgType;
  bgColor?: string;
  bgGradientFrom?: string;
  bgGradientTo?: string;
  bgGradientAngle?: number;
  bgImageUrl?: string;
  bgVideoUrl?: string;
  bgBlur?: number;
  overlayColor?: string;
  overlayOpacity?: number;

  /** Hero Effects Engine v2.0 — see features/builder/effects/hero-effects.ts */
  effects?: import("./effects/hero-effects").HeroEffectsConfig;
}



export type TextAlign = "left" | "center" | "right";
export type TextKind = "heading" | "paragraph";
export type FontSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
export type FontWeight = "normal" | "medium" | "semibold" | "bold";

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  text: string;
  align: TextAlign;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  color?: string;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  text: string;
  kind?: TextKind;
  align: TextAlign;
  fontSize?: FontSize;
  fontWeight?: FontWeight;
  color?: string;
}

export type ButtonAction =
  | "website"
  | "whatsapp"
  | "phone"
  | "email"
  | "telegram"
  | "instagram"
  | "facebook"
  | "youtube"
  | "x"
  | "linkedin"
  | "custom";

export type ButtonWidth = "full" | "auto" | "half";
export type ButtonAlign = "left" | "center" | "right";
export type ButtonStyle =
  | "filled"
  | "outline"
  | "soft"
  | "ghost"
  | "glass"
  | "gradient"
  | "elevated"
  | "neumorphism";

export type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  url: string;
  action?: ButtonAction;
  newTab?: boolean;
  disabled?: boolean;
  style: ButtonStyle;
  width?: ButtonWidth;
  align?: ButtonAlign;
  /** Typography overrides */
  fontFamily?: string;
  fontSizePx?: number;
  fontWeight?: FontWeight;
  letterSpacing?: number; // px
  lineHeight?: number; // unitless
  textTransform?: TextTransform;
  textAlign?: TextAlign;
  /** Color overrides — Normal state */
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  /** Color overrides — Hover state */
  hoverTextColor?: string;
  hoverBgColor?: string;
  hoverBorderColor?: string;
  /** Auto-contrast text color from bg. Default true. */
  autoContrast?: boolean;
}

export type ImageFit = "cover" | "contain";
export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
  alt?: string;
  link?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
  fit?: ImageFit;
}

export type DividerStyle = "solid" | "dashed" | "dotted";
export type DividerSpacing = "sm" | "md" | "lg";
export type DividerVariant = "line" | "gradient" | "icon" | "text";
export interface DividerBlock extends BaseBlock {
  type: "divider";
  variant?: DividerVariant;
  style?: DividerStyle;
  spacing?: DividerSpacing;
  thickness: "thin" | "medium" | "thick";
  gradientFrom?: string;
  gradientTo?: string;
  icon?: string; // lucide icon key
  label?: string; // for text divider
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: number;
}

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "threads"
  | "linkedin"
  | "pinterest"
  | "telegram"
  | "whatsapp"
  | "github"
  | "twitter"
  | "website"
  | "custom";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
}
export interface SocialBlock extends BaseBlock {
  type: "social";
  links: SocialLink[];
}

// ── Video ────────────────────────────────────────────────────────────────
export type VideoProvider = "youtube" | "vimeo" | "mp4";
export interface VideoBlock extends BaseBlock {
  type: "video";
  provider: VideoProvider;
  url: string;
  thumbnailUrl?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  rounded?: "none" | "sm" | "md" | "lg" | "xl";
}

// ── Gallery ──────────────────────────────────────────────────────────────
export type GalleryLayout = "grid" | "carousel" | "masonry";
export interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  link?: string;
}
export interface GalleryBlock extends BaseBlock {
  type: "gallery";
  layout: GalleryLayout;
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg";
  images: GalleryImage[];
}

// ── Social Feed (architecture only) ──────────────────────────────────────
export type SocialFeedProvider = "instagram" | "youtube" | "tiktok" | "pinterest";
export interface SocialFeedBlock extends BaseBlock {
  type: "socialFeed";
  provider: SocialFeedProvider;
  handle?: string; // @user or channel
  limit?: number; // desired items to show once connected
}

// ── Testimonials ─────────────────────────────────────────────────────────
export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  rating?: number; // 0-5
  review: string;
}
export interface TestimonialsBlock extends BaseBlock {
  type: "testimonials";
  title?: string;
  items: Testimonial[];
}

// ── FAQ ──────────────────────────────────────────────────────────────────
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
export interface FaqBlock extends BaseBlock {
  type: "faq";
  title?: string;
  items: FaqItem[];
}

// ── Countdown ────────────────────────────────────────────────────────────
export interface CountdownBlock extends BaseBlock {
  type: "countdown";
  title?: string;
  target: string; // ISO datetime
  timezone?: string;
  finishedLabel?: string;
}

// ── Map ──────────────────────────────────────────────────────────────────
export interface MapBlock extends BaseBlock {
  type: "map";
  mapUrl: string; // Google Maps share url or embed src
  locationName?: string;
  address?: string;
}

// ── File Download ────────────────────────────────────────────────────────
export type FileKind = "pdf" | "docx" | "zip" | "image" | "custom";
export interface FileBlock extends BaseBlock {
  type: "file";
  fileUrl: string;
  fileName: string;
  fileKind?: FileKind;
  sizeLabel?: string;
  buttonLabel?: string;
}

// ── Contact Card ─────────────────────────────────────────────────────────
export interface ContactBlock extends BaseBlock {
  type: "contact";
  title?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  whatsapp?: string;
}

// ── Button Group ─────────────────────────────────────────────────────────
export type ButtonGroupLayout = "horizontal" | "vertical" | "grid";
export interface ButtonGroupItem {
  id: string;
  label: string;
  url: string;
  /** Link behavior */
  newTab?: boolean;
  relNofollow?: boolean;
  relNoopener?: boolean;
  disabled?: boolean;
  /** Visual style variant */
  style?: ButtonStyle;
  /** Colors — Normal state */
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  /** Colors — Hover state */
  hoverBgColor?: string;
  hoverTextColor?: string;
  hoverBorderColor?: string;
  /** Colors — Pressed / active state */
  pressedBgColor?: string;
  pressedTextColor?: string;
  /** Gradient (used when style === "gradient") */
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number; // deg
  /** Auto-contrast text from bg. Default true. */
  autoContrast?: boolean;
  /** Typography overrides */
  fontFamily?: string;
  fontSizePx?: number;
  fontWeight?: FontWeight;
  letterSpacing?: number;
  lineHeight?: number;
  textTransform?: TextTransform;
  textAlign?: TextAlign;
  /** Layout / sizing */
  widthMode?: "full" | "auto";
  minHeight?: number;
  paddingX?: number;
  paddingY?: number;
  marginTop?: number;
  marginBottom?: number;
  radius?: number; // px, use 9999 for pill
  borderWidth?: number;
  /** Icons (lucide-react icon key from ICON_LIBRARY) */
  leftIcon?: string;
  rightIcon?: string;
  iconSize?: number;
  iconColor?: string;
  iconGap?: number;
  /** Effect layer — reuses the button effects engine */
  effect?: ButtonEffect;
  effectColor?: string;
  effectColor2?: string;
  effectSpeed?: number;
  effectIntensity?: number;
  effectMode?: "always" | "hover" | "click";
  /** Shadow */
  shadowColor?: string;
  shadowBlur?: number;
  shadowSpread?: number;
  shadowOpacity?: number;
  shadowY?: number;
}
export interface ButtonGroupBlock extends BaseBlock {
  type: "buttonGroup";
  layout: ButtonGroupLayout;
  columns?: 2 | 3;
  /** Gap between buttons in px */
  gap?: number;
  /** Group alignment */
  align?: "left" | "center" | "right" | "stretch";
  /** On mobile viewports, force vertical stack */
  stackOnMobile?: boolean;
  buttons: ButtonGroupItem[];
}

// ── Embed (trusted providers only) ───────────────────────────────────────
export type EmbedProvider =
  | "spotify"
  | "appleMusic"
  | "googleForms"
  | "typeform"
  | "youtube"
  | "loom"
  | "figma"
  | "canva"
  | "notion";
export interface EmbedBlock extends BaseBlock {
  type: "embed";
  provider: EmbedProvider;
  url: string;
  height?: number; // px
}

// ── Custom Code (HTML / CSS / optional JS) ───────────────────────────────
export interface CustomCodeBlock extends BaseBlock {
  type: "customCode";
  title?: string;
  description?: string;
  html?: string;
  css?: string;
  js?: string;
  /** Per-block toggle. Runs only if workspace also enables custom JS. */
  jsEnabled?: boolean;
  /** Key of the preset last inserted, for analytics/UX. */
  presetKey?: string;
  /** Origin library entry, when inserted from HTML Library. */
  sourceLibraryId?: string;
  containerWidth?: "narrow" | "full" | "wide";
  minHeight?: number;
  borderRadius?: number;
  lazy?: boolean;
  /** Visual HTML Builder configuration (layout/style/button/motion). */
  design?: import("@/features/custom-code/design").CcDesign;
}


export interface GenericBlock extends BaseBlock {
  type: Exclude<
    BlockType,
    | "profile"
    | "heading"
    | "text"
    | "button"
    | "image"
    | "divider"
    | "spacer"
    | "social"
    | "video"
    | "gallery"
    | "socialFeed"
    | "testimonials"
    | "faq"
    | "countdown"
    | "map"
    | "file"
    | "contact"
    | "buttonGroup"
    | "embed"
    | "customCode"
  >;
  [key: string]: unknown;
}

export type Block =
  | ProfileBlock
  | HeadingBlock
  | TextBlock
  | ButtonBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | SocialBlock
  | VideoBlock
  | GalleryBlock
  | SocialFeedBlock
  | TestimonialsBlock
  | FaqBlock
  | CountdownBlock
  | MapBlock
  | FileBlock
  | ContactBlock
  | ButtonGroupBlock
  | EmbedBlock
  | CustomCodeBlock
  | GenericBlock;

import type { PageTheme } from "./theme";

export interface BioContent {
  blocks: Block[];
  /** Global theme controlling the entire page appearance. Optional for
   * backward compatibility — renderer falls back to DEFAULT_THEME. */
  theme?: PageTheme;
  page?: Record<string, unknown>;
  sections?: unknown[];
  gallery?: unknown[];
  buttons?: unknown[];
  socialLinks?: unknown[];
  images?: unknown[];
  videos?: unknown[];
  faq?: unknown[];
  testimonials?: unknown[];
  products?: unknown[];
  services?: unknown[];
  forms?: unknown[];
  embeds?: unknown[];
  files?: unknown[];
  animations?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  /** Floating smart contact widget configuration (LS contact widget). */
  contactWidget?: import("@/features/contact-widget/types").ContactWidgetConfig;
}


export const EMPTY_CONTENT: BioContent = { blocks: [] };

/** Random 10-char id — collision-safe within a page's block list. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 12);
}
