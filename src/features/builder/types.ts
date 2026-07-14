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
  | "embed"
  | "html"
  | "form"
  | "store"
  | "booking"
  | "countdown"
  | "map"
  | "faq"
  | "testimonials";

export interface BaseBlock {
  id: string;
  type: BlockType;
  hidden?: boolean;
  name?: string; // user rename for the layers panel
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

export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  url: string;
  action?: ButtonAction;
  newTab?: boolean;
  disabled?: boolean;
  style: "filled" | "outline" | "soft";
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
export interface DividerBlock extends BaseBlock {
  type: "divider";
  style?: DividerStyle;
  spacing?: DividerSpacing;
  thickness: "thin" | "medium" | "thick";
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer";
  height: number; // px
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

export interface GenericBlock extends BaseBlock {
  type: Exclude<
    BlockType,
    "profile" | "heading" | "text" | "button" | "image" | "divider" | "spacer" | "social"
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
  | GenericBlock;

export interface BioContent {
  blocks: Block[];
}

export const EMPTY_CONTENT: BioContent = { blocks: [] };

/** Random 10-char id — collision-safe within a page's block list. */
export function newId(): string {
  return Math.random().toString(36).slice(2, 12);
}
