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
  | "socialButtons"
  | "whatsappButton"
  | "callButton"
  | "emailButton"
  | "smsButton"
  | "telegramButton"
  | "followCard"
  | "qrContact"
  | "integration"
  | "highlightCards"

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
  /** Auto Layout: per-viewport section spacing overrides (px). */
  spaceTop?: number;
  spaceBottom?: number;
  /** Font size multiplier for scalable text inside the block. */
  fontScale?: number;
}

export type Viewport = "mobile" | "tablet" | "desktop";

/** Shared visual/behavior settings available on every advanced block. */
export interface BlockSettings {
  /**
   * Auto Layout Engine — outer stacking space for the section.
   * `spaceTop` defaults to 0, `spaceBottom` falls back to the page's
   * Default Section Gap (theme.spacing.sectionGap). Sections always flow
   * one after another; Spacer blocks are never required.
   */
  spaceTop?: number; // px
  spaceBottom?: number; // px
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
  /**
   * Element-level typography overrides. All optional — `undefined` inherits
   * the theme / parent value, so existing blocks are unaffected.
   */
  fontStyle?: "normal" | "italic";
  fontWeightNum?: number; // 100–900
  letterSpacingEm?: number; // em
  lineHeightNum?: number; // unitless
  textTransformOverride?: TextTransform;
  textDecoration?: "none" | "underline" | "line-through" | "overline";
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
  color?: string;
}

export type SocialIconStyle =
  | "minimal"
  | "glass"
  | "gradient"
  | "filled"
  | "outline"
  | "neon"
  | "luxury"
  | "corporate";
export type SocialIconShape = "circle" | "rounded" | "square";
export type SocialIconAnimation = "none" | "float" | "pulse" | "bounce" | "scale" | "rotate";
export type SocialIconHover = "lift" | "glow" | "fill" | "rotate" | "scale" | "none";
export type SocialIconLabels = "hidden" | "always" | "hover";
export type SocialColorMode = "brand" | "custom";

export interface SocialBlock extends BaseBlock {
  type: "social";
  links: SocialLink[];
  /** Visual preset. Defaults to "minimal" for legacy blocks. */
  iconStyle?: SocialIconStyle;
  shape?: SocialIconShape;
  /** Icon glyph size in px. */
  iconSize?: number;
  /** Gap between icons in px. */
  spacing?: number;
  /** Extra border radius in px (only used when shape = "rounded"). */
  radius?: number;
  shadow?: boolean;
  glow?: boolean;
  colorMode?: SocialColorMode;
  customColor?: string;
  iconColor?: string;
  animation?: SocialIconAnimation;
  labels?: SocialIconLabels;
  hoverEffect?: SocialIconHover;
  align?: TextAlign;
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
  /** Carousel options */
  autoplay?: boolean;
  autoplaySpeed?: number;
  loop?: boolean;
  showArrows?: boolean;
  showDots?: boolean;
  /** Open images fullscreen on click (default true) */
  lightbox?: boolean;
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

// ── Highlight Cards ──────────────────────────────────────────────────────
/** How a card's icon is sourced. */
export type HighlightIconKind = "none" | "emoji" | "svg" | "image";
/** Section layout modes for the Highlight Cards block. */
export type HighlightLayout = "scroll" | "grid" | "centered" | "carousel" | "masonry";
/** Card surface treatment. */
export type HighlightCardStyle = "solid" | "gradient" | "glass" | "outline";
export type HighlightShadow = "none" | "sm" | "md" | "lg" | "xl";

export interface HighlightCard {
  id: string;
  iconKind?: HighlightIconKind;
  /** Emoji glyph when iconKind = "emoji". */
  emoji?: string;
  /** Raw inline SVG markup when iconKind = "svg" (sanitized at render). */
  svg?: string;
  /** Uploaded / library image url when iconKind = "image". */
  imageUrl?: string;
  title: string;
  description?: string;
  url?: string;
  newTab?: boolean;
  /** Per-card colour overrides (fall back to the section settings). */
  bgColor?: string;
  textColor?: string;
}

export interface HighlightCardsBlock extends BaseBlock {
  type: "highlightCards";
  title?: string;
  subtitle?: string;
  layout: HighlightLayout;
  /** Columns per viewport for grid / masonry layouts. */
  columns?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  /** Auto horizontal scroll on mobile when there are many cards. */
  mobileScroll?: boolean;
  gap?: "sm" | "md" | "lg";
  cardStyle?: HighlightCardStyle;
  bgColor?: string;
  gradientFrom?: string;
  gradientTo?: string;
  textColor?: string;
  border?: boolean;
  borderColor?: string;
  /** Card corner radius in px. */
  radius?: number;
  shadow?: HighlightShadow;
  animation?: EntranceAnim;
  hover?: HoverEffect;
  iconSize?: number;
  align?: "left" | "center";
  // ── Carousel engine settings (layout = "carousel") ─────────────────────
  /** Infinite loop. Default: true. */
  carouselLoop?: boolean;
  /** Autoplay. Default: false. */
  carouselAutoplay?: boolean;
  /** Autoplay delay in ms. Default: 4000. */
  carouselAutoplayDelay?: number;
  /** Pause autoplay while hovering. Default: true. */
  carouselPauseOnHover?: boolean;
  /** Pause autoplay on touch/drag. Default: true. */
  carouselPauseOnTouch?: boolean;
  /** Transition duration knob (Embla `duration`, ~ms/10). Default: 28. */
  carouselSpeed?: number;
  /** Drag / swipe enabled. Default: true. */
  carouselDrag?: boolean;
  /** Mouse-wheel navigation. Default: false. */
  carouselWheel?: boolean;
  /** Arrow-key navigation when focused. Default: true. */
  carouselKeyboard?: boolean;
  /** Show prev/next arrows. Default: true. */
  carouselArrows?: boolean;
  /** Show pagination dots. Default: true. */
  carouselDots?: boolean;
  cards: HighlightCard[];
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


// ── Integration (Integration Center — structured JSON only) ──────────────
export interface IntegrationBlock extends BaseBlock {
  type: "integration";
  /** Provider key from the integration registry (e.g. "whatsapp"). */
  provider: string;
  /** Display mode: button | embed | popup | newTab | floating. */
  mode: string;
  /** Structured provider + style configuration. Never raw HTML. */
  config: Record<string, string | number | boolean | undefined>;
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
    | "integration"
    | "socialButtons"
    | "whatsappButton"
    | "callButton"
    | "emailButton"
    | "smsButton"
    | "telegramButton"
    | "followCard"
    | "qrContact"
    | "form"
    | "store"
    | "booking"
  >;
  [key: string]: unknown;
}

// ── Business Tools (lightweight, bio-link scoped — NOT eCommerce) ────────
export type BusinessCardStyle = "glass" | "solid" | "outline";

export type FormFieldType =
  | "name"
  | "email"
  | "phone"
  | "company"
  | "subject"
  | "message"
  | "text"
  | "textarea"
  | "website"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "file";

export interface FormFieldDef {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  /** dropdown / radio / checkbox choices */
  options?: string[];
  /** Legacy: equivalent to width "full". */
  fullWidth?: boolean;
  /** Field width inside a 2-column layout. */
  width?: "half" | "full";
  /** Hidden fields are not rendered on the live page. */
  hidden?: boolean;
  helpText?: string;
  defaultValue?: string;
  maxLength?: number;
}

export type FormButtonStyle = "solid" | "gradient" | "outline" | "soft";

/** Contact Form block — submissions land in Dashboard → Leads. */
export interface ContactFormBlock extends BaseBlock {
  type: "form";
  title?: string;
  description?: string;
  fields: FormFieldDef[];
  submitLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  redirectUrl?: string;
  /** Email notification target (future delivery hook). */
  notifyEmail?: string;
  /** WhatsApp notification target — future-ready, stored only. */
  notifyWhatsapp?: string;
  cardStyle?: BusinessCardStyle;
  radius?: number;
  columns?: 1 | 2;
  /** Design controls */
  shadow?: "none" | "sm" | "md" | "lg";
  padding?: number;
  fontFamily?: string;
  buttonStyle?: FormButtonStyle;
  buttonRadius?: number;
  /** Prevent the same visitor submitting the same content twice. */
  preventDuplicates?: boolean;
}

export type StoreItemKind =
  | "digital"
  | "service"
  | "payment_link"
  | "buy_now"
  | "whatsapp"
  | "upi_qr"
  | "razorpay";

export type StoreBadge =
  | "none"
  | "new"
  | "hot"
  | "best_seller"
  | "limited"
  | "sale"
  | "popular";

/** What the card's action button does when tapped. */
export type StoreItemAction =
  | "buy_now"
  | "payment_link"
  | "whatsapp"
  | "download"
  | "external";

export interface StoreItem {
  id: string;
  kind: StoreItemKind;
  title: string;
  /** Short description shown on the card. */
  description?: string;
  /** Full description shown in the detail popup. */
  longDescription?: string;
  image?: string;
  coverImage?: string;
  /** Extra images shown in the detail popup. */
  gallery?: string[];
  price?: number;
  oldPrice?: number;
  /** Per-item currency symbol; falls back to the block currency. */
  currency?: string;
  action?: StoreItemAction;
  buttonLabel?: string;
  /** Buy Now / Payment Link / Razorpay link / external URL */
  url?: string;
  /** Digital delivery link (PDF, ZIP, course…) */
  downloadUrl?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  upiId?: string;
  upiQrImage?: string;
  payeeName?: string;
  badge?: StoreBadge;
  hidden?: boolean;
  /** Catalog row this card was imported from (Dashboard → Mini Store). */
  catalogId?: string;
}

export type StoreLayout =
  | "grid"
  | "list"
  | "featured"
  | "carousel"
  | "modern"
  | "glass"
  | "compact";

/** Mini Store — a few products/services, no cart/checkout/inventory. */
export interface MiniStoreBlock extends BaseBlock {
  type: "store";
  title?: string;
  subtitle?: string;
  description?: string;
  layout?: StoreLayout;
  columns?: 1 | 2 | 3;
  cardStyle?: BusinessCardStyle;
  radius?: number;
  /** Gap between cards, px. */
  gap?: number;
  /** Section padding, px. */
  spacing?: number;
  /** Section background (CSS colour or gradient). */
  background?: string;
  /** Divider under the section header. */
  divider?: boolean;
  currency?: string;
  showPrice?: boolean;
  showOldPrice?: boolean;
  showBadge?: boolean;
  showDescription?: boolean;
  showButton?: boolean;
  showImage?: boolean;
  shadow?: "none" | "sm" | "md" | "lg";
  hoverAnimation?: "none" | "lift" | "zoom" | "glow";
  entranceAnimation?: "none" | "fade" | "rise";
  /** Open the product detail popup when a card is tapped. */
  detailPopup?: boolean;
  /** Show related products inside the popup. */
  showRelated?: boolean;
  items: StoreItem[];
}


export type BookingKind = "appointment" | "meeting" | "consultation";

/** Lightweight 1:1 booking block — requests land in Dashboard → Bookings. */
export interface BookingBlock extends BaseBlock {
  type: "booking";
  title?: string;
  description?: string;
  kind?: BookingKind;
  durationMin?: number;
  /** 0 = Sunday … 6 = Saturday */
  days?: number[];
  /** "HH:MM" 24h slots */
  slots?: string[];
  timezone?: string;
  locationType?: "online" | "offline";
  meetingProvider?: "google_meet" | "zoom" | "whatsapp" | "custom";
  meetingLink?: string;
  address?: string;
  requirePhone?: boolean;
  confirmationMessage?: string;
  emailConfirmation?: boolean;
  notifyEmail?: string;
  submitLabel?: string;
  cardStyle?: BusinessCardStyle;
  radius?: number;
}


// ── Social & Contact blocks ──────────────────────────────────────────────
export type SocialSurfaceStyle = "filled" | "outline" | "soft" | "glass";

export interface SocialButtonItem {
  id: string;
  platform: SocialPlatform;
  label?: string;
  url: string;
  color?: string;
}

/** Labelled social buttons (icon + text), a richer sibling of Social Icons. */
export interface SocialButtonsBlock extends BaseBlock {
  type: "socialButtons";
  items: SocialButtonItem[];
  style?: SocialSurfaceStyle;
  layout?: "stack" | "grid";
  columns?: number;
  radius?: number;
  showIcons?: boolean;
  colorMode?: SocialColorMode;
  customColor?: string;
  align?: TextAlign;
}

export type ContactActionType =
  | "whatsappButton"
  | "callButton"
  | "emailButton"
  | "smsButton"
  | "telegramButton";

/** One-tap communication button (WhatsApp / Call / Email / SMS / Telegram). */
export interface ContactActionBlock extends BaseBlock {
  type: ContactActionType;
  /** Phone number, email address or telegram username depending on the type. */
  value?: string;
  label?: string;
  /** Prefilled message (WhatsApp, SMS, Telegram) or email body. */
  message?: string;
  /** Email subject. */
  subject?: string;
  style?: SocialSurfaceStyle;
  size?: "sm" | "md" | "lg";
  width?: "full" | "auto";
  align?: TextAlign;
  radius?: number;
  showIcon?: boolean;
  brandColor?: boolean;
  color?: string;
  newTab?: boolean;
}

/** Profile-style follow card with social CTAs. */
export interface FollowCardBlock extends BaseBlock {
  type: "followCard";
  avatarUrl?: string;
  name?: string;
  handle?: string;
  description?: string;
  links: SocialLink[];
  layout?: "card" | "minimal";
  align?: TextAlign;
  radius?: number;
  showIcons?: boolean;
  /** Button customization */
  buttonStyle?: import("./types").ButtonStyle;
  buttonWidthMode?: "auto" | "full" | "custom";
  buttonWidthCustom?: number;
  buttonHeightMode?: "sm" | "md" | "lg" | "custom";
  buttonHeightCustom?: number;
  buttonAlign?: "left" | "center" | "right";
  buttonSize?: "sm" | "md" | "lg";
  buttonRadius?: number;
  buttonPaddingX?: number;
  buttonPaddingY?: number;
  buttonFontSize?: number;
  buttonFontWeight?: import("./types").FontWeight;
  buttonGap?: number;
  buttonIconSize?: number;
  buttonIconPosition?: "left" | "right";
  buttonColor?: string;
  buttonBgColor?: string;
  buttonBorderColor?: string;
  buttonHoverBgColor?: string;
  buttonHoverTextColor?: string;
  buttonHoverBorderColor?: string;
  buttonShadowSize?: "none" | "sm" | "md" | "lg" | "xl";
  buttonShadowBlur?: number;
  buttonShadowColor?: string;
}

/** Scannable vCard / link QR code with contact details. */
export interface QrContactBlock extends BaseBlock {
  type: "qrContact";
  title?: string;
  note?: string;
  mode?: "vcard" | "url";
  url?: string;
  fullName?: string;
  org?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  size?: number;
  color?: string;
  background?: string;
  showDetails?: boolean;
  downloadable?: boolean;
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
  | IntegrationBlock
  | HighlightCardsBlock
  | SocialButtonsBlock
  | ContactActionBlock
  | FollowCardBlock
  | QrContactBlock
  | ContactFormBlock
  | MiniStoreBlock
  | BookingBlock
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
