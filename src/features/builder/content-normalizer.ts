import type {
  BioContent,
  Block,
  ButtonBlock,
  ButtonGroupBlock,
  ButtonGroupItem,
  ButtonStyle,
  FaqBlock,
  FaqItem,
  GalleryBlock,
  GalleryImage,
  HighlightCard,
  HighlightCardsBlock,

  MapBlock,
  SocialBlock,
  SocialLink,
  SocialPlatform,
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

  return normalized as unknown as BioContent;
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
    case "highlightCards":
      return normalizeHighlightCardsBlock(base, id) as Block;

    default:
      return base as Block;
  }
}

/**
 * Highlight Cards travel through templates, imports, duplicates and version
 * snapshots as plain JSON, so backfill every layout/style field here rather
 * than requiring a migration on existing pages.
 */
function normalizeHighlightCardsBlock(raw: JsonObject, id: string): HighlightCardsBlock {
  const source = asArray(raw.cards).length > 0 ? asArray(raw.cards) : asArray(raw.items);
  const cards = source.reduce<HighlightCard[]>((acc, item, index) => {
    if (!isObject(item)) return acc;
    const row = item as JsonObject;
    const title = stringValue(row.title) || stringValue(row.label);
    const emoji = stringValue(row.emoji);
    const svg = stringValue(row.svg);
    const imageUrl = stringValue(row.imageUrl) || stringValue(row.image);
    const iconKind =
      row.iconKind === "emoji" || row.iconKind === "svg" || row.iconKind === "image" || row.iconKind === "none"
        ? (row.iconKind as HighlightCard["iconKind"])
        : imageUrl
          ? "image"
          : svg
            ? "svg"
            : emoji
              ? "emoji"
              : "none";
    if (!title && iconKind === "none") return acc;
    acc.push({
      ...row,
      id: stringValue(row.id) || `${id}-card-${index + 1}`,
      iconKind,
      emoji,
      svg,
      imageUrl,
      title,
      description: stringValue(row.description) || undefined,
      url: stringValue(row.url) || stringValue(row.link) || undefined,
      newTab: row.newTab !== false,
    } as HighlightCard);
    return acc;
  }, []);

  const layouts = ["scroll", "grid", "centered", "carousel", "masonry"];
  const styles = ["solid", "gradient", "glass", "outline"];
  const shadows = ["none", "sm", "md", "lg", "xl"];
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  return {
    ...raw,
    type: "highlightCards",
    layout: layouts.includes(raw.layout as string) ? raw.layout : "grid",
    columns: num(raw.columns, 3),
    columnsTablet: num(raw.columnsTablet, 2),
    columnsMobile: num(raw.columnsMobile, 1),
    mobileScroll: raw.mobileScroll !== false,
    gap: raw.gap === "sm" || raw.gap === "lg" ? raw.gap : "md",
    cardStyle: styles.includes(raw.cardStyle as string) ? raw.cardStyle : "solid",
    border: raw.border !== false,
    radius: num(raw.radius, 16),
    shadow: shadows.includes(raw.shadow as string) ? raw.shadow : "md",
    iconSize: num(raw.iconSize, 34),
    align: raw.align === "left" ? "left" : "center",
    carouselLoop: raw.carouselLoop !== false,
    carouselAutoplay: raw.carouselAutoplay === true,
    carouselAutoplayDelay: num(raw.carouselAutoplayDelay, 4000),
    carouselPauseOnHover: raw.carouselPauseOnHover !== false,
    carouselPauseOnTouch: raw.carouselPauseOnTouch !== false,
    carouselSpeed: num(raw.carouselSpeed, 28),
    carouselDrag: raw.carouselDrag !== false,
    carouselWheel: raw.carouselWheel === true,
    carouselKeyboard: raw.carouselKeyboard !== false,
    carouselArrows: raw.carouselArrows !== false,
    carouselDots: raw.carouselDots !== false,
    cards,
  } as HighlightCardsBlock;
}

function normalizeGalleryBlock(raw: JsonObject, id: string): GalleryBlock {

  const source = asArray(raw.images).length > 0 ? asArray(raw.images) : asArray(raw.items);
  const images = source.reduce<GalleryImage[]>((acc, item, index) => {
      if (!isObject(item)) return acc;
      const row = item as JsonObject;
      const url = stringValue(row.url);
      if (!url) return acc;
      acc.push({
        id: stringValue(row.id) || `${id}-image-${index + 1}`,
        url,
        alt: stringValue(row.alt) || stringValue(row.caption) || "",
        link: stringValue(row.link) || undefined,
      });
      return acc;
    }, []);

  return {
    ...raw,
    type: "gallery",
    layout: raw.layout === "carousel" || raw.layout === "masonry" ? raw.layout : "grid",
    columns: raw.columns === 3 || raw.columns === 4 ? raw.columns : 2,
    gap: raw.gap === "sm" || raw.gap === "lg" ? raw.gap : "md",
    rounded: raw.rounded === "none" || raw.rounded === "sm" || raw.rounded === "lg" ? raw.rounded : "md",
    autoplay: raw.autoplay !== false,
    autoplaySpeed:
      typeof raw.autoplaySpeed === "number" && raw.autoplaySpeed >= 1500 ? raw.autoplaySpeed : 4000,
    loop: raw.loop !== false,
    showArrows: raw.showArrows !== false,
    showDots: raw.showDots !== false,
    lightbox: raw.lightbox !== false,
    images,
  } as GalleryBlock;
}

function normalizeSocialBlock(raw: JsonObject, id: string): SocialBlock {
  const source = asArray(raw.links).length > 0 ? asArray(raw.links) : asArray(raw.items);
  const links = source.reduce<SocialLink[]>((acc, item, index) => {
      if (!isObject(item)) return acc;
      const row = item as JsonObject;
      const platform = stringValue(row.platform) || "custom";
      const url = stringValue(row.url);
      if (!url) return acc;
      acc.push({
        id: stringValue(row.id) || `${id}-social-${index + 1}`,
        platform: platform as SocialPlatform,
        url,
        label: stringValue(row.label) || undefined,
      });
      return acc;
    }, []);

  const num = (v: unknown, fallback: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

  // Legacy blocks carry only { links }; every style option falls back to a
  // premium-safe default so existing pages keep rendering without edits.
  return {
    ...raw,
    type: "social",
    links,
    iconStyle: pick(
      raw.iconStyle,
      ["minimal", "glass", "gradient", "filled", "outline", "neon", "luxury", "corporate"] as const,
      "minimal",
    ),
    shape: pick(raw.shape, ["circle", "rounded", "square"] as const, "circle"),
    iconSize: num(raw.iconSize, 18, 12, 48),
    spacing: num(raw.spacing, 12, 0, 48),
    radius: num(raw.radius, 14, 0, 32),
    shadow: raw.shadow !== false,
    glow: raw.glow === true,
    colorMode: pick(raw.colorMode, ["brand", "custom"] as const, "brand"),
    customColor: stringValue(raw.customColor) || undefined,
    iconColor: stringValue(raw.iconColor) || undefined,
    animation: pick(
      raw.animation,
      ["none", "float", "pulse", "bounce", "scale", "rotate"] as const,
      "none",
    ),
    labels: pick(raw.labels, ["hidden", "always", "hover"] as const, "hidden"),
    hoverEffect: pick(
      raw.hoverEffect,
      ["lift", "glow", "fill", "rotate", "scale", "none"] as const,
      "lift",
    ),
    align: pick(raw.align, ["left", "center", "right"] as const, "center"),
  } as SocialBlock;
}

function normalizeTestimonialsBlock(raw: JsonObject, id: string): TestimonialsBlock {
  const items = asArray(raw.items).reduce<Testimonial[]>((acc, item, index) => {
      if (!isObject(item)) return acc;
      const row = item as JsonObject;
      acc.push({
        id: stringValue(row.id) || `${id}-testimonial-${index + 1}`,
        name: stringValue(row.name) || "Customer",
        role: stringValue(row.role) || undefined,
        avatarUrl: stringValue(row.avatarUrl) || undefined,
        rating: typeof row.rating === "number" ? row.rating : undefined,
        review: stringValue(row.review) || stringValue(row.quote) || "",
      });
      return acc;
    }, []);

  return { ...raw, type: "testimonials", title: stringValue(raw.title) || undefined, items } as TestimonialsBlock;
}

function normalizeFaqBlock(raw: JsonObject, id: string): FaqBlock {
  const items = asArray(raw.items).reduce<FaqItem[]>((acc, item, index) => {
      if (!isObject(item)) return acc;
      const row = item as JsonObject;
      acc.push({
        id: stringValue(row.id) || `${id}-faq-${index + 1}`,
        question: stringValue(row.question) || "Question",
        answer: stringValue(row.answer) || "",
      });
      return acc;
    }, []);

  return { ...raw, type: "faq", title: stringValue(raw.title) || undefined, items } as FaqBlock;
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
  const buttons = asArray(raw.buttons).reduce<ButtonGroupItem[]>((acc, item, index) => {
      if (!isObject(item)) return acc;
      const row = item as JsonObject;
      acc.push({
        ...row,
        id: stringValue(row.id) || `${id}-button-${index + 1}`,
        label: stringValue(row.label) || "Button",
        url: stringValue(row.url),
        style: VALID_BUTTON_STYLES.has(stringValue(row.style) as ButtonStyle)
          ? (stringValue(row.style) as ButtonStyle)
          : "filled",
      } as ButtonGroupItem);
      return acc;
    }, []);

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