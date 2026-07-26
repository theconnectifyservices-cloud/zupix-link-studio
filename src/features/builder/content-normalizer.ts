import type {
  BioContent,
  Block,
  ButtonBlock,
  ButtonGroupBlock,
  ButtonStyle,
  FaqBlock,
  GalleryBlock,
  GalleryImage,
  MapBlock,
  SocialBlock,
  SocialLink,
  Testimonial,
  TestimonialsBlock,
} from "./types";
import { normalizeTheme } from "./theme";

type JsonObject = Record<string, unknown>;

const COLLECTION_KEYS = [
  "sections",
  "blocks",
  "gallery",
  "buttons",
  "socialLinks",
  "images",
  "videos",
  "faq",
  "testimonials",
  "products",
  "services",
  "forms",
  "embeds",
  "files",
] as const;

const OBJECT_KEYS = ["page", "animations", "theme", "seo", "settings", "analytics"] as const;

const VALID_BUTTON_STYLES = new Set<ButtonStyle>([
  "filled",
  "outline",
  "soft",
  "ghost",
  "glass",
  "gradient",
  "elevated",
  "neumorphism",
]);

export function createEmptyBioContent(): BioContent {
  return normalizeBioContent({});
}

export function normalizeBioContent(input?: Partial<BioContent> | null): BioContent {
  const raw = isObject(input) ? (input as JsonObject) : {};
  const normalized: JsonObject = { ...raw };

  for (const key of COLLECTION_KEYS) {
    normalized[key] = asArray(raw[key]);
  }
  for (const key of OBJECT_KEYS) {
    normalized[key] = isObject(raw[key]) ? raw[key] : {};
  }

  normalized.theme = normalizeTheme(isObject(raw.theme) ? raw.theme : {});
  normalized.blocks = asArray(raw.blocks)
    .map((block, index) => normalizeBlock(block, index))
    .filter((block): block is Block => Boolean(block));

  return normalized as BioContent;
}

function normalizeBlock(block: unknown, index: number): Block | null {
  if (!isObject(block)) return null;
  const raw = block as JsonObject;
  const type = typeof raw.type === "string" ? raw.type : "text";
  const id = typeof raw.id === "string" && raw.id ? raw.id : `block-${index + 1}`;
  const base = { ...raw, id, type };

  switch (type) {
    case "gallery":
      return normalizeGalleryBlock(base, id);
    case "social":
      return normalizeSocialBlock(base, id);
    case "testimonials":
      return normalizeTestimonialsBlock(base, id);
    case "faq":
      return normalizeFaqBlock(base, id);
    case "button":
      return normalizeButtonBlock(base) as Block;
    case "buttonGroup":
      return normalizeButtonGroupBlock(base, id) as Block;
    case "map":
      return normalizeMapBlock(base) as Block;
    default:
      return base as Block;
  }
}

function normalizeGalleryBlock(raw: JsonObject, id: string): GalleryBlock {
  const source = asArray(raw.images).length > 0 ? asArray(raw.images) : asArray(raw.items);
  const images: GalleryImage[] = source
    .map((item, index) => {
      if (!isObject(item)) return null;
      const row = item as JsonObject;
      const url = stringValue(row.url);
      if (!url) return null;
      return {
        id: stringValue(row.id) || `${id}-image-${index + 1}`,
        url,
        alt: stringValue(row.alt) || stringValue(row.caption) || "",
        link: stringValue(row.link) || undefined,
      };
    })
    .filter((image): image is GalleryImage => Boolean(image));

  return {
    ...raw,
    type: "gallery",
    layout: raw.layout === "carousel" || raw.layout === "masonry" ? raw.layout : "grid",
    columns: raw.columns === 3 || raw.columns === 4 ? raw.columns : 2,
    gap: raw.gap === "sm" || raw.gap === "lg" ? raw.gap : "md",
    rounded: raw.rounded === "none" || raw.rounded === "sm" || raw.rounded === "lg" ? raw.rounded : "md",
    images,
  } as GalleryBlock;
}

function normalizeSocialBlock(raw: JsonObject, id: string): SocialBlock {
  const source = asArray(raw.links).length > 0 ? asArray(raw.links) : asArray(raw.items);
  const links: SocialLink[] = source
    .map((item, index) => {
      if (!isObject(item)) return null;
      const row = item as JsonObject;
      const platform = stringValue(row.platform) || "custom";
      const url = stringValue(row.url);
      if (!url) return null;
      return {
        id: stringValue(row.id) || `${id}-social-${index + 1}`,
        platform: platform as SocialLink["platform"],
        url,
        label: stringValue(row.label) || undefined,
      };
    })
    .filter((link): link is SocialLink => Boolean(link));

  return { ...raw, type: "social", links } as SocialBlock;
}

function normalizeTestimonialsBlock(raw: JsonObject, id: string): TestimonialsBlock {
  const items: Testimonial[] = asArray(raw.items)
    .map((item, index) => {
      if (!isObject(item)) return null;
      const row = item as JsonObject;
      return {
        id: stringValue(row.id) || `${id}-testimonial-${index + 1}`,
        name: stringValue(row.name) || "Customer",
        role: stringValue(row.role) || undefined,
        avatarUrl: stringValue(row.avatarUrl) || undefined,
        rating: typeof row.rating === "number" ? row.rating : undefined,
        review: stringValue(row.review) || stringValue(row.quote) || "",
      };
    })
    .filter((item): item is Testimonial => Boolean(item));

  return { ...raw, type: "testimonials", title: stringValue(raw.title) || undefined, items };
}

function normalizeFaqBlock(raw: JsonObject, id: string): FaqBlock {
  const items = asArray(raw.items)
    .map((item, index) => {
      if (!isObject(item)) return null;
      const row = item as JsonObject;
      return {
        id: stringValue(row.id) || `${id}-faq-${index + 1}`,
        question: stringValue(row.question) || "Question",
        answer: stringValue(row.answer) || "",
      };
    })
    .filter((item): item is FaqBlock["items"][number] => Boolean(item));

  return { ...raw, type: "faq", title: stringValue(raw.title) || undefined, items };
}

function normalizeButtonBlock(raw: JsonObject): ButtonBlock {
  const style = stringValue(raw.style);
  return {
    ...raw,
    type: "button",
    label: stringValue(raw.label) || "Button",
    url: stringValue(raw.url),
    style: VALID_BUTTON_STYLES.has(style as ButtonStyle) ? (style as ButtonStyle) : "filled",
    width: raw.width === "auto" || raw.width === "half" ? raw.width : "full",
    align: raw.align === "left" || raw.align === "right" ? raw.align : "center",
  } as ButtonBlock;
}

function normalizeButtonGroupBlock(raw: JsonObject, id: string): ButtonGroupBlock {
  const buttons = asArray(raw.buttons)
    .map((item, index) => {
      if (!isObject(item)) return null;
      const row = item as JsonObject;
      return {
        ...row,
        id: stringValue(row.id) || `${id}-button-${index + 1}`,
        label: stringValue(row.label) || "Button",
        url: stringValue(row.url),
        style: VALID_BUTTON_STYLES.has(stringValue(row.style) as ButtonStyle)
          ? (stringValue(row.style) as ButtonStyle)
          : "filled",
      };
    })
    .filter((button): button is ButtonGroupBlock["buttons"][number] => Boolean(button));

  return {
    ...raw,
    type: "buttonGroup",
    layout: raw.layout === "horizontal" || raw.layout === "grid" ? raw.layout : "vertical",
    columns: raw.columns === 3 ? 3 : 2,
    buttons,
  } as ButtonGroupBlock;
}

function normalizeMapBlock(raw: JsonObject): MapBlock {
  return {
    ...raw,
    type: "map",
    mapUrl: stringValue(raw.mapUrl) || stringValue(raw.embedUrl),
    locationName: stringValue(raw.locationName) || stringValue(raw.label) || undefined,
    address: stringValue(raw.address) || stringValue(raw.label) || undefined,
  } as MapBlock;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}