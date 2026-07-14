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
  // reserved for later phases
  | "html"
  | "form"
  | "store"
  | "booking";

/** Shared visual/behavior settings available on every advanced block. */
export interface BlockSettings {
  paddingY?: number;   // px
  paddingX?: number;   // px
  marginTop?: number;  // px
  marginBottom?: number; // px
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  background?: string; // css color
  animation?: "none" | "fade" | "slide-up" | "zoom"; // placeholder — no runtime yet
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  hidden?: boolean;
  locked?: boolean;
  name?: string;
  settings?: BlockSettings;
}

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
export type ButtonStyle = "filled" | "outline" | "soft";

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
  limit?: number;  // desired items to show once connected
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
  target: string;  // ISO datetime
  timezone?: string;
  finishedLabel?: string;
}

// ── Map ──────────────────────────────────────────────────────────────────
export interface MapBlock extends BaseBlock {
  type: "map";
  mapUrl: string;   // Google Maps share url or embed src
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
  style?: ButtonStyle;
}
export interface ButtonGroupBlock extends BaseBlock {
  type: "buttonGroup";
  layout: ButtonGroupLayout;
  columns?: 2 | 3;
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

export interface GenericBlock extends BaseBlock {
  type: Exclude<
    BlockType,
    | "profile" | "heading" | "text" | "button" | "image" | "divider" | "spacer" | "social"
    | "video" | "gallery" | "socialFeed" | "testimonials" | "faq" | "countdown" | "map"
    | "file" | "contact" | "buttonGroup" | "embed"
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
  | GenericBlock;

import type { PageTheme } from "./theme";

export interface BioContent {
  blocks: Block[];
  /** Global theme controlling the entire page appearance. Optional for
   * backward compatibility — renderer falls back to DEFAULT_THEME. */
  theme?: PageTheme;
}

export const EMPTY_CONTENT: BioContent = { blocks: [] };

/** Random 10-char id — collision-safe within a page's block list. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 12);
}
