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
  displayName: string;
  bio?: string;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  text: string;
  align: "left" | "center" | "right";
}

export interface TextBlock extends BaseBlock {
  type: "text";
  text: string;
  align: "left" | "center" | "right";
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  url: string;
  style: "filled" | "outline" | "soft";
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  url: string;
  alt?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
  thickness: "thin" | "medium" | "thick";
}

export interface SocialLink {
  id: string;
  platform: "twitter" | "instagram" | "youtube" | "tiktok" | "linkedin" | "github" | "website";
  url: string;
}
export interface SocialBlock extends BaseBlock {
  type: "social";
  links: SocialLink[];
}

export interface GenericBlock extends BaseBlock {
  type: Exclude<
    BlockType,
    "profile" | "heading" | "text" | "button" | "image" | "divider" | "social"
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
