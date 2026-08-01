import { useEffect, useRef, useState, type CSSProperties } from "react";
import type {
  Block,
  BlockSettings,
  ContactBlock,
  CountdownBlock,
  CustomCodeBlock,
  EmbedBlock,
  EntranceAnim,
  FaqBlock,
  FileBlock,
  FontSize,
  FontWeight,
  GalleryBlock,
  MapBlock,
  SocialFeedBlock,
  SocialPlatform,
  TestimonialsBlock,
  VideoBlock,
  ButtonGroupBlock,
  ButtonBlock,
  Viewport,
} from "./types";
import { buildSrcDoc } from "@/features/custom-code/sanitize";
import { ErrorBoundary } from "@/shared/error/error-boundary";

import { useRendererMode } from "./renderer-mode";
import { GalleryRender } from "./components/gallery-render";
import { resolveHeroEffects } from "./effects/hero-effects";
import { getIcon as getButtonIcon } from "./button-icons";
import { cn } from "@/lib/utils";
import { buildEmbed } from "./video-source";
import { AutoplayVideo } from "./components/autoplay-video";
import {
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Github,
  Globe,
  Music2,
  Facebook,
  MessageCircle,
  Send,
  AtSign,
  Image as ImageIcon,
  BadgeCheck,
  MapPin,
  Link as LinkIcon,
  ChevronDown,
  Star,
  Download,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Play,
  FileText,
  FileArchive,
  File as FileIcon,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useBuilderStore } from "./store";
import { DEFAULT_PROFILE } from "./theme";
import { HighlightCardsRender } from "./components/highlight-cards-render";
import { SocialIconsRender } from "./components/social-icons-render";
import {
  ContactActionRender,
  FollowCardRender,
  QrContactRender,
  SocialButtonsRender,
} from "./components/social-contact-render";
import type { HighlightCardsBlock } from "./types";
import { IntegrationRender } from "./integrations/integration-render";


const FONT_SIZE: Record<FontSize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};
const FONT_WEIGHT: Record<FontWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};
const WIDTH_CLASS = { full: "w-full", auto: "w-auto px-6", half: "w-1/2" } as const;
const ALIGN_WRAP = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
} as const;

const RADIUS_CLASS: Record<NonNullable<BlockSettings["radius"]>, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-2xl",
  full: "rounded-full",
};

/** Normalize legacy animation ids. */
function normalizeAnim(a?: BlockSettings["animation"]): EntranceAnim {
  if (!a || a === "none") return "none";
  if (a === "zoom") return "zoom-in";
  return a;
}

interface RenderProps {
  block: Block;
  /** Active preview viewport. Drives responsive overrides + visibility. */
  viewport?: Viewport;
  /** Zero-based index in the block list — used to stagger entrance timing. */
  index?: number;
  /** Global stagger step in ms (from theme.motion). */
  staggerStep?: number;
  /** Force-disable animations regardless of block settings. */
  reduceMotion?: boolean;
}

export function BlockRenderer({
  block,
  viewport = "mobile",
  index = 0,
  staggerStep = 0,
  reduceMotion = false,
}: RenderProps) {
  if (block.hidden) return null;
  const s = block.settings ?? {};

  // Visibility per viewport (undefined = shown)
  const vis = s.visibility ?? {};
  if (viewport === "mobile" && vis.mobile === false) return null;
  if (viewport === "tablet" && vis.tablet === false) return null;
  if (viewport === "desktop" && vis.desktop === false) return null;

  // Per-viewport overrides
  const rOver = s.responsive?.[viewport] ?? {};
  const paddingX = rOver.paddingX ?? s.paddingX;
  const paddingY = rOver.paddingY ?? s.paddingY;
  const marginTop = rOver.marginTop ?? s.marginTop;
  const marginBottom = rOver.marginBottom ?? s.marginBottom;
  const fontScale = rOver.fontScale;

  const anim = reduceMotion ? "none" : normalizeAnim(s.animation);
  const hover = s.hover && s.hover !== "none" ? s.hover : null;

  // Button effects are applied INSIDE the button element (see ButtonRender),
  // never on the outer block wrapper — otherwise the effect layer paints the
  // full-width rectangle behind the pill.
  const isButtonish = block.type === "button" || block.type === "buttonGroup";

  const wrapCls = cn(
    s.radius && !isButtonish && RADIUS_CLASS[s.radius],
    anim !== "none" && `zx-anim zx-anim-${anim}`,
    hover && `zx-hover zx-hover-${hover}`,
  );

  const style: CSSProperties = {
    paddingTop: paddingY,
    paddingBottom: paddingY,
    paddingLeft: paddingX,
    paddingRight: paddingX,
    marginTop,
    marginBottom,
    background: s.background,
  };
  // Element font override: beats the theme font for this block only. Also
  // shadows the theme font vars so nested nodes that reference them follow.
  if (s.fontFamily) {
    style.fontFamily = s.fontFamily;
    const vars = style as Record<string, string>;
    vars["--zx-heading-family"] = s.fontFamily;
    vars["--zx-btn-font"] = s.fontFamily;
  }
  if (fontScale && fontScale !== 1) style.fontSize = `${fontScale}em`;
  if (anim !== "none") {
    (style as Record<string, string>)["--zx-anim-dur"] = `${s.animationDuration ?? 600}ms`;
    (style as Record<string, string>)["--zx-anim-delay"] =
      `${(s.animationDelay ?? 0) + index * staggerStep}ms`;
    (style as Record<string, string>)["--zx-anim-repeat"] =
      s.animationRepeat === "infinite" ? "infinite" : "1";
  }

  const hasWrap =
    !!s.background ||
    !!s.fontFamily ||
    !!paddingX ||
    !!paddingY ||
    !!marginTop ||
    !!marginBottom ||
    (!isButtonish && !!s.radius) ||
    anim !== "none" ||
    !!hover ||
    (fontScale && fontScale !== 1);


  const inner = renderInner(block, reduceMotion, viewport);
  const commonProps = {
    className: wrapCls,
    style,
  } as const;
  const content = hasWrap ? <div {...commonProps}>{inner}</div> : inner;

  // ── Auto Layout Engine ────────────────────────────────────────────────
  // Every section is wrapped in a flow-level box that owns its outer
  // spacing. Sections always stack after the previous one's rendered
  // height + its bottom spacing, so Spacer blocks are never required.
  const spaceTop = rOver.spaceTop ?? s.spaceTop;
  const spaceBottom = rOver.spaceBottom ?? s.spaceBottom;
  // Creative blocks (spacer/divider) are self-spacing: no implicit gap.
  const selfSpaced = block.type === "spacer";
  const layoutStyle: CSSProperties = {
    marginTop: `${spaceTop ?? 0}px`,
    marginBottom:
      spaceBottom !== undefined
        ? `${spaceBottom}px`
        : selfSpaced
          ? "0px"
          : "var(--zx-section-gap, 32px)",
  };

  return (
    <div
      className="zx-section"
      style={layoutStyle}
      data-block-id={block.id}
      data-block-type={block.type}
      data-hide-mobile={vis.mobile === false || undefined}
      data-hide-tablet={vis.tablet === false || undefined}
      data-hide-desktop={vis.desktop === false || undefined}
    >
      {content}
    </div>
  );
}


// Button effects live in the shared engine (./button-fx) so that every
// button-like widget uses the exact same pipeline. Re-exported for
// backward compatibility with existing imports.
import { computeButtonFx, InteractiveFxWrapper, fxSettingsFromItem } from "./button-fx";
export { computeButtonFx } from "./button-fx";




function renderInner(block: Block, reduceMotion: boolean, viewport: Viewport = "mobile") {
  switch (block.type) {
    case "profile":
      return <ProfileRender block={block} />;

    case "heading":
      return (
        <h2
          style={{
            ...(block.color ? { color: block.color } : {}),
            fontFamily: "var(--zx-heading-family)",
            fontWeight: "var(--zx-heading-weight, 700)",
            textTransform: "var(--zx-text-transform, none)" as CSSProperties["textTransform"],
          }}
          className={cn(
            FONT_SIZE[block.fontSize ?? "xl"],
            FONT_WEIGHT[block.fontWeight ?? "bold"],
            block.align === "center" && "text-center",
            block.align === "right" && "text-right",
          )}
        >
          {block.text || "Heading"}
        </h2>
      );

    case "text":
      return (
        <p
          style={block.color ? { color: block.color } : undefined}
          className={cn(
            "whitespace-pre-wrap text-foreground/80",
            FONT_SIZE[block.fontSize ?? "sm"],
            FONT_WEIGHT[block.fontWeight ?? "normal"],
            block.align === "center" && "text-center",
            block.align === "right" && "text-right",
          )}
        >
          {block.text}
        </p>
      );

    case "button": {
      return <ButtonRender block={block} reduceMotion={reduceMotion} />;
    }

    case "buttonGroup":
      return <ButtonGroupRender block={block} reduceMotion={reduceMotion} />;


    case "image": {
      if (!block.url) {
        return (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Add an image URL
          </div>
        );
      }
      return (
        <img
          src={block.url}
          alt={block.alt ?? ""}
          className={cn(
            "w-full",
            block.fit === "contain" ? "object-contain" : "object-cover",
            block.rounded === "full" && "rounded-full",
            block.rounded === "lg" && "rounded-2xl",
            block.rounded === "md" && "rounded-lg",
            block.rounded === "sm" && "rounded",
          )}
        />
      );
    }

    case "divider":
      return <DividerRender block={block} />;

    case "spacer":
      return <div style={{ height: `${block.height ?? 24}px` }} aria-hidden />;

    case "social":
      return <SocialIconsRender block={block} />;


    case "video":
      return <VideoRender block={block} />;
    case "gallery":
      return <GalleryRender block={block} />;
    case "socialFeed":
      return <SocialFeedRender block={block} />;
    case "testimonials":
      return <TestimonialsRender block={block} />;
    case "faq":
      return <FaqRender block={block} />;
    case "countdown":
      return <CountdownRender block={block} />;
    case "map":
      return <MapRender block={block} />;
    case "file":
      return <FileRender block={block} />;
    case "contact":
      return <ContactRender block={block} />;
    case "socialButtons":
      return <SocialButtonsRender block={block} />;
    case "whatsappButton":
    case "callButton":
    case "emailButton":
    case "smsButton":
    case "telegramButton":
      return <ContactActionRender block={block} />;
    case "followCard":
      return <FollowCardRender block={block} />;
    case "qrContact":
      return <QrContactRender block={block} />;
    case "integration":
      return <IntegrationRender block={block} />;
    case "highlightCards":
      return <HighlightCardsRender block={block as HighlightCardsBlock} viewport={viewport} />;
    case "embed":

      return <EmbedRender block={block} />;
    case "customCode":
      return (
        <ErrorBoundary
          fallback={
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive">
              <div className="font-medium">Custom Code couldn't be rendered</div>
              <div className="mt-1 opacity-80">
                Check the HTML for unsupported or malformed markup.
              </div>
            </div>
          }
        >
          <CustomCodeRender block={block} />
        </ErrorBoundary>
      );



    default:
      return (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          {block.type} · coming soon
        </div>
      );
  }
}

// ── Divider variants ─────────────────────────────────────────────────────
function DividerRender({ block }: { block: Extract<Block, { type: "divider" }> }) {
  const spacing = block.spacing === "lg" ? "my-6" : block.spacing === "sm" ? "my-1" : "my-3";
  const variant = block.variant ?? "line";
  if (variant === "gradient") {
    const from = block.gradientFrom ?? "transparent";
    const to = block.gradientTo ?? "transparent";
    const mid = block.gradientFrom ?? "currentColor";
    return (
      <div
        className={spacing}
        style={{
          height: block.thickness === "thick" ? 4 : block.thickness === "medium" ? 2 : 1,
          background: `linear-gradient(to right, ${from}, ${mid}, ${to})`,
        }}
      />
    );
  }
  if (variant === "icon") {
    return (
      <div className={cn("flex items-center gap-3 text-muted-foreground", spacing)}>
        <span className="h-px flex-1 bg-foreground/20" />
        <Sparkles className="h-4 w-4" />
        <span className="h-px flex-1 bg-foreground/20" />
      </div>
    );
  }
  if (variant === "text") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted-foreground",
          spacing,
        )}
      >
        <span className="h-px flex-1 bg-foreground/20" />
        <span>{block.label || "Section"}</span>
        <span className="h-px flex-1 bg-foreground/20" />
      </div>
    );
  }
  const style =
    block.style === "dashed"
      ? "border-dashed"
      : block.style === "dotted"
        ? "border-dotted"
        : "border-solid";
  return (
    <hr
      className={cn(
        "border-foreground/20",
        style,
        spacing,
        block.thickness === "medium" && "border-t-2",
        block.thickness === "thick" && "border-t-4",
      )}
    />
  );
}

// ── Button (single) ──────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function autoContrastText(bg: string | undefined): string | undefined {
  if (!bg) return undefined;
  const rgb = hexToRgb(bg);
  if (!rgb) return undefined;
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? "#000000" : "#ffffff";
}
/**
 * Resolve a raw url + action into an href suitable for an <a> tag.
 * Handles WhatsApp (wa.me), Telegram (t.me), tel:, mailto:, and prepends https://
 * for bare domains. Returns undefined when nothing usable is configured.
 */
function resolveHref(
  url: string | undefined,
  action?: import("./types").ButtonAction,
): string | undefined {
  const raw = (url ?? "").trim();
  if (!raw) return undefined;
  const lower = raw.toLowerCase();
  const hasScheme = /^[a-z][a-z0-9+.-]*:/.test(lower);
  switch (action) {
    case "phone":
      return lower.startsWith("tel:") ? raw : `tel:${raw.replace(/[^\d+]/g, "")}`;
    case "email":
      return lower.startsWith("mailto:") ? raw : `mailto:${raw}`;
    case "whatsapp": {
      if (hasScheme) return raw;
      const digits = raw.replace(/[^\d]/g, "");
      return digits ? `https://wa.me/${digits}` : raw;
    }
    case "telegram":
      return hasScheme ? raw : `https://t.me/${raw.replace(/^@/, "")}`;
    default:
      return hasScheme || lower.startsWith("/") || lower.startsWith("#") ? raw : `https://${raw}`;
  }
}

function ButtonRender({
  block,
  reduceMotion = false,
}: {
  block: ButtonBlock;
  reduceMotion?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const autoOn = block.autoContrast !== false;
  const normalBg = block.bgColor;
  const hoverBg = block.hoverBgColor;
  const normalText =
    block.textColor ?? (autoOn ? autoContrastText(normalBg) : undefined);
  const hoverText =
    block.hoverTextColor ?? (autoOn ? autoContrastText(hoverBg ?? normalBg) : undefined);
  const bg = hover && hoverBg ? hoverBg : normalBg;
  const fg = hover && (hoverText || block.hoverTextColor) ? hoverText : normalText;
  const borderCol = hover && block.hoverBorderColor ? block.hoverBorderColor : block.borderColor;

  const fx = computeButtonFx(block.settings ?? {}, reduceMotion);

  const style: CSSProperties = {
    background: bg ?? "var(--zx-btn-bg)",
    color: fg ?? "var(--zx-btn-fg)",
    border: borderCol ? `1px solid ${borderCol}` : "var(--zx-btn-border)",
    borderRadius: "var(--zx-btn-radius)",
    minHeight: "var(--zx-btn-h)",
    paddingLeft: "var(--zx-btn-px)",
    paddingRight: "var(--zx-btn-px)",
    boxShadow: "var(--zx-btn-shadow)",
    fontFamily: block.fontFamily ?? "var(--zx-btn-font)",
    fontSize: block.fontSizePx ? `${block.fontSizePx}px` : "var(--zx-btn-size)",
    letterSpacing: block.letterSpacing != null ? `${block.letterSpacing}px` : undefined,
    lineHeight: block.lineHeight ?? undefined,
    textTransform: (block.textTransform ?? "none") as CSSProperties["textTransform"],
    textAlign: block.textAlign,
    fontWeight:
      block.fontWeight === "bold"
        ? 700
        : block.fontWeight === "semibold"
          ? 600
          : block.fontWeight === "medium"
            ? 500
            : block.fontWeight === "normal"
              ? 400
              : undefined,
    // Clip pseudo-element effects (shine/liquid/spotlight/gradient/etc.)
    // to the button's rounded shape so they never bleed into a rectangle.
    overflow: "hidden",
    position: "relative",
    isolation: "isolate",
    ...fx.style,
  };
  const pillClass = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-all hover:-translate-y-0.5",
    WIDTH_CLASS[block.width ?? "full"],
    block.disabled && "cursor-not-allowed opacity-50 hover:translate-y-0",
    fx.className,
  );
  const pill = fx.needsInteractive ? (
    <InteractiveFxWrapper
      className={pillClass}
      style={style}
      effect={fx.effect as "magnetic" | "spotlight"}
      intensity={fx.intensity}
      distance={fx.distance}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {block.label || "Button"}
    </InteractiveFxWrapper>
  ) : (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={pillClass}
      style={style}
    >
      {block.label || "Button"}
    </div>
  );
  const href = block.disabled ? undefined : resolveHref(block.url, block.action);
  const newTab = block.newTab ?? true;
  const wrapped = href ? (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className={cn("contents", WIDTH_CLASS[block.width ?? "full"] === "w-full" && "w-full")}
      aria-label={block.label || "Button"}
    >
      {pill}
    </a>
  ) : (
    pill
  );
  return (
    <div className={cn("flex", ALIGN_WRAP[block.align ?? "center"])}>{wrapped}</div>
  );
}

// ── Button group ─────────────────────────────────────────────────────────
function fontWeightNum(fw?: FontWeight): number | undefined {
  return fw === "bold" ? 700 : fw === "semibold" ? 600 : fw === "medium" ? 500 : fw === "normal" ? 400 : undefined;
}

function buildGroupItemStyle(
  item: import("./types").ButtonGroupItem,
  hover: boolean,
): CSSProperties {
  const autoOn = item.autoContrast !== false;
  const normalBg = item.bgColor;
  const normalText = item.textColor ?? (autoOn ? autoContrastText(normalBg) : undefined);
  const hoverText =
    item.hoverTextColor ?? (autoOn ? autoContrastText(item.hoverBgColor ?? normalBg) : undefined);
  const bg = hover && item.hoverBgColor ? item.hoverBgColor : normalBg;
  const fg = hover && (item.hoverTextColor || hoverText) ? hoverText : normalText;
  const borderCol = hover && item.hoverBorderColor ? item.hoverBorderColor : item.borderColor;

  // Style variant defaults (used when no explicit color set)
  const style: CSSProperties = {};
  const variant = item.style ?? "filled";
  if (variant === "outline") {
    style.background = bg ?? "transparent";
    style.color = fg ?? "hsl(var(--foreground))";
    style.border = `${item.borderWidth ?? 1}px solid ${borderCol ?? "hsl(var(--foreground) / 0.3)"}`;
  } else if (variant === "soft") {
    style.background = bg ?? "hsl(var(--muted))";
    style.color = fg ?? "hsl(var(--foreground))";
    if (borderCol) style.border = `${item.borderWidth ?? 1}px solid ${borderCol}`;
  } else if (variant === "ghost") {
    style.background = bg ?? "transparent";
    style.color = fg ?? "hsl(var(--foreground))";
    if (borderCol) style.border = `${item.borderWidth ?? 1}px solid ${borderCol}`;
  } else if (variant === "glass") {
    style.background = bg ?? "rgba(255,255,255,0.08)";
    style.color = fg ?? "hsl(var(--foreground))";
    style.backdropFilter = "blur(12px)";
    (style as Record<string, string>).WebkitBackdropFilter = "blur(12px)";
    style.border = `${item.borderWidth ?? 1}px solid ${borderCol ?? "rgba(255,255,255,0.18)"}`;
  } else if (variant === "gradient") {
    const from = item.gradientFrom ?? "#8b5cf6";
    const to = item.gradientTo ?? "#ec4899";
    const angle = item.gradientAngle ?? 90;
    style.background = `linear-gradient(${angle}deg, ${from}, ${to})`;
    style.color = fg ?? autoContrastText(from) ?? "#ffffff";
    if (borderCol) style.border = `${item.borderWidth ?? 1}px solid ${borderCol}`;
  } else if (variant === "elevated") {
    style.background = bg ?? "hsl(var(--background))";
    style.color = fg ?? "hsl(var(--foreground))";
    if (borderCol) style.border = `${item.borderWidth ?? 1}px solid ${borderCol}`;
    style.boxShadow = "0 8px 24px -6px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.08)";
  } else if (variant === "neumorphism") {
    style.background = bg ?? "#e6e7ee";
    style.color = fg ?? "#333";
    style.boxShadow =
      "8px 8px 16px rgba(163,177,198,0.6), -8px -8px 16px rgba(255,255,255,0.9)";
  } else {
    // filled
    style.background = bg ?? "hsl(var(--foreground))";
    style.color = fg ?? "hsl(var(--background))";
    if (borderCol) style.border = `${item.borderWidth ?? 1}px solid ${borderCol}`;
  }

  // Custom shadow overrides
  if (item.shadowBlur != null || item.shadowColor || item.shadowSpread != null) {
    const c = item.shadowColor ?? "#000000";
    const opacity = item.shadowOpacity ?? 0.25;
    const [r, g, b] = hexToRgb(c) ?? [0, 0, 0];
    style.boxShadow = `0 ${item.shadowY ?? 6}px ${item.shadowBlur ?? 16}px ${item.shadowSpread ?? 0}px rgba(${r},${g},${b},${opacity})`;
  }

  // Layout / typography
  if (item.radius != null) style.borderRadius = `${item.radius}px`;
  if (item.minHeight != null) style.minHeight = `${item.minHeight}px`;
  if (item.paddingX != null) {
    style.paddingLeft = `${item.paddingX}px`;
    style.paddingRight = `${item.paddingX}px`;
  }
  if (item.paddingY != null) {
    style.paddingTop = `${item.paddingY}px`;
    style.paddingBottom = `${item.paddingY}px`;
  }
  if (item.marginTop != null) style.marginTop = `${item.marginTop}px`;
  if (item.marginBottom != null) style.marginBottom = `${item.marginBottom}px`;
  if (item.fontFamily) style.fontFamily = item.fontFamily;
  if (item.fontSizePx) style.fontSize = `${item.fontSizePx}px`;
  if (item.fontWeight) style.fontWeight = fontWeightNum(item.fontWeight);
  if (item.letterSpacing != null) style.letterSpacing = `${item.letterSpacing}px`;
  if (item.lineHeight != null) style.lineHeight = item.lineHeight;
  if (item.textTransform) style.textTransform = item.textTransform as CSSProperties["textTransform"];
  if (item.textAlign) style.textAlign = item.textAlign;
  if (item.iconGap != null) style.gap = `${item.iconGap}px`;

  return style;
}

function GroupItemRender({
  item,
  layout,
  reduceMotion,
}: {
  item: import("./types").ButtonGroupItem;
  layout: import("./types").ButtonGroupLayout;
  reduceMotion: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const LeftIcon = getButtonIcon(item.leftIcon);
  const RightIcon = getButtonIcon(item.rightIcon);
  const iconSize = item.iconSize ?? 16;

  const baseStyle = buildGroupItemStyle(item, hover);
  if (pressed) {
    if (item.pressedBgColor) baseStyle.background = item.pressedBgColor;
    if (item.pressedTextColor) baseStyle.color = item.pressedTextColor;
  }
  baseStyle.overflow = "hidden";
  baseStyle.position = "relative";
  baseStyle.isolation = "isolate";

  // Effect layer via existing engine
  const fxSettings: BlockSettings = fxSettingsFromItem(item);

  const fx = computeButtonFx(fxSettings, reduceMotion);
  const style: CSSProperties = { ...baseStyle, ...fx.style };

  const widthCls =
    item.widthMode === "auto"
      ? ""
      : layout === "vertical" || item.widthMode === "full"
        ? "w-full"
        : "";

  const btnClass = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-center text-sm font-medium transition-all",
    !item.disabled && "hover:-translate-y-0.5",
    item.disabled && "cursor-not-allowed opacity-50",
    widthCls,
    fx.className,
  );

  const inner = (
    <>
      {LeftIcon && <LeftIcon size={iconSize} color={item.iconColor} />}
      <span>{item.label || "Button"}</span>
      {RightIcon && <RightIcon size={iconSize} color={item.iconColor} />}
    </>
  );

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPressed(false);
    },
    onMouseDown: () => setPressed(true),
    onMouseUp: () => setPressed(false),
  };

  const href = item.disabled ? undefined : resolveHref(item.url);
  const newTab = item.newTab ?? true;
  const relParts = [
    newTab || item.relNoopener ? "noopener noreferrer" : null,
    item.relNofollow ? "nofollow" : null,
  ]
    .filter(Boolean)
    .join(" ");
  const body = fx.needsInteractive ? (
    <InteractiveFxWrapper
      className={btnClass}
      style={style}
      effect={fx.effect as "magnetic" | "spotlight"}
      intensity={fx.intensity}
      distance={fx.distance}
      {...handlers}
    >
      {inner}
    </InteractiveFxWrapper>
  ) : (
    <div className={btnClass} style={style} {...handlers}>
      {inner}
    </div>
  );
  if (!href) return body;
  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={relParts || undefined}
      className={cn("contents", widthCls === "w-full" && "w-full")}
      aria-label={item.label || "Button"}
    >
      {body}
    </a>
  );
}

function ButtonGroupRender({
  block,
  reduceMotion = false,
}: {
  block: ButtonGroupBlock;
  reduceMotion?: boolean;
}) {
  const buttons = block.buttons ?? [];
  if (buttons.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        No buttons yet
      </div>
    );
  }
  const gap = block.gap ?? 8;
  const alignCls =
    block.align === "left"
      ? "justify-start"
      : block.align === "right"
        ? "justify-end"
        : block.align === "stretch"
          ? "justify-stretch"
          : "justify-center";

  const cls =
    block.layout === "horizontal"
      ? cn("flex flex-wrap items-center", alignCls, block.stackOnMobile && "max-sm:flex-col max-sm:items-stretch")
      : block.layout === "grid"
        ? cn(
            "grid",
            block.columns === 3 ? "grid-cols-3" : "grid-cols-2",
            block.stackOnMobile && "max-sm:grid-cols-1",
          )
        : "flex flex-col";

  return (
    <div className={cls} style={{ gap: `${gap}px` }}>
      {buttons.map((b) => (
        <GroupItemRender key={b.id} item={b} layout={block.layout} reduceMotion={reduceMotion} />
      ))}
    </div>
  );
}



// ── Video ────────────────────────────────────────────────────────────────
function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
  return m ? m[1] : null;
}
function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}
function VideoRender({ block }: { block: VideoBlock }) {
  const roundedCls =
    block.rounded === "xl"
      ? "rounded-2xl"
      : block.rounded === "lg"
        ? "rounded-xl"
        : block.rounded === "md"
          ? "rounded-lg"
          : block.rounded === "sm"
            ? "rounded"
            : "rounded-none";
  if (!block.url) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center border border-dashed text-xs text-muted-foreground",
          roundedCls,
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Play className="h-6 w-6" /> Add a video URL
        </div>
      </div>
    );
  }
  if (block.provider === "mp4") {
    const wantAutoplay = block.autoplay !== false;
    if (wantAutoplay) {
      return (
        <AutoplayVideo
          src={block.url}
          poster={block.thumbnailUrl}
          loop={block.loop !== false}
          controls
          objectFit="contain"
          className={cn("aspect-video w-full bg-black", roundedCls)}
        />
      );
    }
    return (
      <video
        src={block.url}
        controls
        muted={block.muted}
        loop={block.loop}
        playsInline
        preload="metadata"
        poster={block.thumbnailUrl}
        className={cn("aspect-video w-full bg-black", roundedCls)}
      />
    );
  }
  const params = new URLSearchParams();
  const wantAutoplay = block.autoplay !== false;
  if (wantAutoplay) {
    params.set("autoplay", "1");
    // Autoplay requires muted on mobile browsers.
    params.set("mute", "1");
  } else if (block.muted) {
    params.set("mute", "1");
  }
  params.set("playsinline", "1");
  params.set("rel", "0");
  params.set("modestbranding", "1");
  let src = "";
  if (block.provider === "youtube") {
    const id = extractYouTubeId(block.url);
    if (!id)
      return (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          Invalid YouTube URL
        </div>
      );
    if (block.loop) {
      params.set("loop", "1");
      params.set("playlist", id);
    }
    src = `https://www.youtube.com/embed/${id}?${params.toString()}`;
  } else {
    const id = extractVimeoId(block.url);
    if (!id)
      return (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          Invalid Vimeo URL
        </div>
      );
    if (block.loop) params.set("loop", "1");
    src = `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }
  return (
    <div className={cn("aspect-video w-full overflow-hidden bg-black", roundedCls)}>
      <iframe
        src={src}
        className="h-full w-full"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        title="Video"
      />
    </div>
  );
}

// ── Social Feed placeholder ─────────────────────────────────────────────
function SocialFeedRender({ block }: { block: SocialFeedBlock }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-center">
      <div className="text-xs font-medium capitalize">{block.provider} feed</div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        {block.handle
          ? `@${block.handle.replace(/^@/, "")}`
          : "Connect an account to load the feed"}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {Array.from({ length: Math.min(block.limit ?? 6, 6) }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────
function TestimonialsRender({ block }: { block: TestimonialsBlock }) {
  const items = block.items ?? [];
  return (
    <div className="space-y-3">
      {block.title && <div className="text-center text-sm font-semibold">{block.title}</div>}
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No testimonials
        </div>
      ) : (
        items.map((t) => (
          <div key={t.id} className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-muted text-xs font-semibold">
                {t.avatarUrl ? (
                  <img src={t.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (t.name || "?").charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{t.name}</div>
                {t.role && (
                  <div className="truncate text-[10px] text-muted-foreground">{t.role}</div>
                )}
              </div>
              {typeof t.rating === "number" && (
                <div className="ml-auto flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < (t.rating ?? 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/40",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-foreground/80">{t.review}</p>
          </div>
        ))
      )}
    </div>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────
function FaqRender({ block }: { block: FaqBlock }) {
  const items = block.items ?? [];
  return (
    <div className="space-y-2">
      {block.title && <div className="text-sm font-semibold">{block.title}</div>}
      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No questions
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {items.map((it) => (
            <AccordionItem key={it.id} value={it.id}>
              <AccordionTrigger className="text-left text-sm">
                {it.question || "Question"}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                {it.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// ── Countdown ────────────────────────────────────────────────────────────
function CountdownRender({ block }: { block: CountdownBlock }) {
  // `Date.now()` differs between the server render and hydration, which throws
  // React #418 (text content mismatch). Start from the block's own target so
  // both renders agree, then switch to the live clock after mount.
  const target = new Date(block.target).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (isNaN(target)) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        Set a target date
      </div>
    );
  }

  // Before mount, both server and client render the same neutral placeholder.
  const diff = now === null ? null : Math.max(0, target - now);

  if (diff !== null && diff <= 0) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-sm font-semibold">{block.finishedLabel || "We're live!"}</div>
      </div>
    );
  }
  const d = diff === null ? null : Math.floor(diff / 86400000);
  const h = diff === null ? null : Math.floor((diff / 3600000) % 24);
  const m = diff === null ? null : Math.floor((diff / 60000) % 60);
  const s = diff === null ? null : Math.floor((diff / 1000) % 60);

  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      {block.title && (
        <div className="mb-2 text-xs font-medium text-muted-foreground">{block.title}</div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {[
          [d, "Days"],
          [h, "Hrs"],
          [m, "Min"],
          [s, "Sec"],
        ].map(([n, l]) => (
          <div key={l as string} className="rounded-lg bg-muted p-2">
            <div className="text-lg font-bold tabular-nums">
              {n === null ? "--" : String(n).padStart(2, "0")}
            </div>
            <div className="text-[10px] text-muted-foreground">{l}</div>
          </div>
        ))}

      </div>
    </div>
  );
}

// ── Map ──────────────────────────────────────────────────────────────────
function MapRender({ block }: { block: MapBlock }) {
  if (!block.mapUrl) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        Add a Google Maps URL
      </div>
    );
  }
  const isEmbed = /google\.com\/maps\/embed/.test(block.mapUrl);
  return (
    <div className="overflow-hidden rounded-xl border">
      {isEmbed ? (
        <iframe
          src={block.mapUrl}
          className="h-48 w-full"
          loading="lazy"
          title="Map"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-muted">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          {block.locationName && (
            <div className="truncate text-sm font-medium">{block.locationName}</div>
          )}
          {block.address && (
            <div className="truncate text-[11px] text-muted-foreground">{block.address}</div>
          )}
        </div>
        <div className="shrink-0 rounded-full bg-foreground px-3 py-1 text-[11px] font-medium text-background">
          Open
        </div>
      </div>
    </div>
  );
}

// ── File Download ────────────────────────────────────────────────────────
function FileRender({ block }: { block: FileBlock }) {
  const Icon =
    block.fileKind === "zip"
      ? FileArchive
      : block.fileKind === "image"
        ? ImageIcon
        : block.fileKind === "docx"
          ? FileText
          : block.fileKind === "pdf"
            ? FileText
            : FileIcon;
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{block.fileName || "File"}</div>
        {block.sizeLabel && (
          <div className="text-[11px] text-muted-foreground">{block.sizeLabel}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background">
        <Download className="h-3.5 w-3.5" /> {block.buttonLabel || "Download"}
      </div>
    </div>
  );
}

// ── Contact Card ─────────────────────────────────────────────────────────
function ContactRender({ block }: { block: ContactBlock }) {
  const rows = [
    block.phone && { icon: Phone, label: block.phone },
    block.email && { icon: Mail, label: block.email },
    block.website && { icon: Globe, label: block.website },
    block.whatsapp && { icon: MessageSquare, label: block.whatsapp },
    block.address && { icon: MapPin, label: block.address },
  ].filter(Boolean) as { icon: LucideIcon; label: string }[];
  return (
    <div className="rounded-xl border bg-card p-3">
      {block.title && <div className="mb-2 text-sm font-semibold">{block.title}</div>}
      {rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">Add contact details</div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-xs">
              <r.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{r.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Embed (trusted only) ─────────────────────────────────────────────────
const EMBED_MATCHERS: Record<EmbedBlock["provider"], (u: string) => string | null> = {
  spotify: (u) =>
    /open\.spotify\.com\//.test(u)
      ? u.replace("open.spotify.com/", "open.spotify.com/embed/")
      : null,
  appleMusic: (u) =>
    /music\.apple\.com\//.test(u) ? u.replace("music.apple.com", "embed.music.apple.com") : null,
  googleForms: (u) =>
    /docs\.google\.com\/forms\//.test(u)
      ? u.includes("?embedded=true")
        ? u
        : `${u}${u.includes("?") ? "&" : "?"}embedded=true`
      : null,
  typeform: (u) => (/typeform\.com\//.test(u) ? u : null),
  youtube: (u) => {
    const m = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  },
  loom: (u) => (/loom\.com\//.test(u) ? u.replace("/share/", "/embed/") : null),
  figma: (u) =>
    /figma\.com\/(file|proto|design)\//.test(u)
      ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(u)}`
      : null,
  canva: (u) => (/canva\.com\//.test(u) ? (u.endsWith("?embed") ? u : `${u}?embed`) : null),
  notion: (u) => (/notion\.(so|site)\//.test(u) ? u : null),
};
function EmbedRender({ block }: { block: EmbedBlock }) {
  if (!block.url) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        Add an embed URL
      </div>
    );
  }
  const src = EMBED_MATCHERS[block.provider]?.(block.url);
  if (!src) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-center text-xs text-destructive">
        URL is not a valid {block.provider} link
      </div>
    );
  }
  return (
    <iframe
      src={src}
      className="w-full overflow-hidden rounded-xl border"
      style={{ height: `${block.height ?? 232}px` }}
      loading="lazy"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
      title={`${block.provider} embed`}
    />
  );
}

// keep icons referenced
void ChevronDown;

// ── Profile block with theme.profile effects + per-block overrides ───────
const SHADOW_MAP: Record<NonNullable<Extract<Block, { type: "profile" }>["avatarShadow"]>, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.08)",
  md: "0 4px 12px rgba(0,0,0,0.12)",
  lg: "0 10px 24px rgba(0,0,0,0.18)",
  xl: "0 20px 40px rgba(0,0,0,0.25)",
};

function ProfileRender({ block }: { block: Extract<Block, { type: "profile" }> }) {
  const theme = useBuilderStore((s) => s.content.theme);
  const prof = theme?.profile ?? DEFAULT_PROFILE;
  const fx = resolveHeroEffects(block.effects);

  const layout = block.layout ?? "center";
  const alignItems =
    layout === "left"
      ? "items-start text-left"
      : layout === "right"
        ? "items-end text-right"
        : "items-center text-center";
  const isSplit = layout === "split";

  // Hero background (existing solid/gradient/image/glass paths)
  const bgStyle: CSSProperties = { ...(fx.cssVars as CSSProperties) };
  const bgType = block.bgType ?? "none";
  if (bgType === "solid" && block.bgColor) bgStyle.background = block.bgColor;
  else if (bgType === "gradient") {
    const from = block.bgGradientFrom ?? "#6366f1";
    const to = block.bgGradientTo ?? "#ec4899";
    const angle = block.bgGradientAngle ?? 135;
    bgStyle.background = `linear-gradient(${angle}deg, ${from}, ${to})`;
  } else if (bgType === "image" && block.bgImageUrl) {
    bgStyle.background = `center/cover no-repeat url(${block.bgImageUrl})`;
  } else if (bgType === "glass") {
    bgStyle.background = block.bgColor ?? "rgba(255,255,255,0.15)";
    bgStyle.backdropFilter = `blur(${block.bgBlur ?? 16}px) saturate(140%)`;
  }
  const hasBg = bgType !== "none" || !!block.coverUrl || !!fx.bgOverlayClass || !!fx.cardClass;

  // Optional media filter (brightness/contrast/blur) for image/video backgrounds
  const bgMediaFilter =
    `blur(var(--zx-hero-bg-blur, 0px)) brightness(var(--zx-hero-bg-brightness, 100%)) contrast(var(--zx-hero-bg-contrast, 100%))`;

  // Overlay (legacy)
  const overlay =
    block.overlayColor && (block.overlayOpacity ?? 0) > 0 ? (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: block.overlayColor,
          opacity: block.overlayOpacity,
        }}
      />
    ) : null;

  // Avatar
  const avatarSize = block.avatarSize ?? 80;
  const avatarRadius = block.avatarRadius ?? 9999;
  const avatarBorderW = block.avatarBorderWidth ?? 4;
  const avatarBorderC = block.avatarBorderColor ?? "#ffffff";
  const avatarShadow = SHADOW_MAP[block.avatarShadow ?? "none"];
  const legacyRing = block.avatarRing ?? "none";
  const legacyRingColor = block.avatarRingColor ?? "#6366f1";
  const zoom = block.avatarZoom ?? 1;

  // Legacy classes retained for backward compat with theme.profile.*
  const legacyAvatarFx = cn(
    prof.avatarGlow && "zx-avatar-glow",
    prof.avatarRing && "zx-avatar-ring",
    prof.avatarRotatingRing && "zx-avatar-rotating-ring",
    prof.avatarFloating && "zx-avatar-floating",
    legacyRing === "glow" && "zx-avatar-glow",
  );

  const avatarInner = (
    <div
      className={cn(
        "grid place-items-center overflow-hidden bg-muted text-2xl font-semibold text-muted-foreground",
        legacyAvatarFx,
        fx.avatarClass,
      )}
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarRadius,
        border: `${avatarBorderW}px solid ${avatarBorderC}`,
        boxShadow: avatarShadow !== "none" ? avatarShadow : undefined,
      }}
    >
      {block.avatarUrl ? (
        <img
          src={block.avatarUrl}
          alt=""
          className={cn(
            "h-full w-full",
            (block.avatarObjectFit ?? "cover") === "contain" ? "object-contain" : "object-cover",
          )}
          style={{ transform: zoom !== 1 ? `scale(${zoom})` : undefined }}
        />
      ) : (
        (block.displayName ?? "?").charAt(0).toUpperCase()
      )}
    </div>
  );

  // Wrap avatar with new ring overlay if configured, else fall back to legacy ring
  const useNewRing =
    !fx.disabled &&
    !!fx.ringClass &&
    (block.effects?.ring?.style ?? "none") !== "none";

  let avatar: React.ReactNode;
  if (useNewRing) {
    avatar = (
      <div
        className={cn("zx-hero-ring-wrap", fx.ringClass, fx.ringOverlayClass)}
        style={{ borderRadius: avatarRadius }}
      >
        {avatarInner}
        <span className="zx-hero-ring-overlay" style={{ borderRadius: avatarRadius }} />
      </div>
    );
  } else if (legacyRing === "gradient") {
    avatar = (
      <div
        className="relative"
        style={{
          padding: avatarBorderW,
          borderRadius: avatarRadius,
          background: `conic-gradient(from 180deg, ${legacyRingColor}, ${block.bgGradientTo ?? "#ec4899"}, ${legacyRingColor})`,
        }}
      >
        {avatarInner}
      </div>
    );
  } else if (legacyRing === "solid") {
    avatar = (
      <div
        className="relative"
        style={{
          padding: avatarBorderW,
          borderRadius: avatarRadius,
          background: legacyRingColor,
        }}
      >
        {avatarInner}
      </div>
    );
  } else {
    avatar = <div className="relative">{avatarInner}</div>;
  }

  // Verified badge
  const badgeSize = block.badgeSize ?? 16;
  const badgePos = block.badgePosition ?? "inline";
  const badgeEl = block.verified ? (
    <span
      className={cn(
        "zx-hero-badge inline-flex items-center justify-center rounded-full",
        prof.badgeAnimation && "zx-badge-anim",
        fx.badgeClass,
        badgePos !== "inline" && "absolute z-[1]",
        badgePos === "top-right" && "right-0 top-0",
        badgePos === "bottom-right" && "bottom-0 right-0",
      )}
      style={{
        width: badgeSize + 4,
        height: badgeSize + 4,
        color: block.badgeColor ?? "hsl(var(--primary))",
        background: block.badgeBgColor,
        border: block.badgeBorderColor ? `2px solid ${block.badgeBorderColor}` : undefined,
      }}
    >
      <BadgeCheck style={{ width: badgeSize, height: badgeSize }} />
    </span>
  ) : null;

  const nameStyle: CSSProperties = {
    fontSize: block.nameFontSizePx ? `${block.nameFontSizePx}px` : "var(--zx-name-size, 18px)",
    fontWeight: block.nameFontWeight
      ? block.nameFontWeight === "bold"
        ? 700
        : block.nameFontWeight === "semibold"
          ? 600
          : block.nameFontWeight === "medium"
            ? 500
            : 400
      : "var(--zx-name-weight, 700)",
    fontFamily: block.nameFontFamily ?? "var(--zx-heading-family)",
    letterSpacing: block.nameLetterSpacing != null ? `${block.nameLetterSpacing}px` : undefined,
    lineHeight: block.nameLineHeight ?? undefined,
    color: block.nameColor,
    textShadow: block.nameTextShadow,
    textTransform: "var(--zx-text-transform, none)" as CSSProperties["textTransform"],
  };

  const bioStyle: CSSProperties = {
    fontSize: block.bioFontSizePx ? `${block.bioFontSizePx}px` : "var(--zx-bio-size, 12px)",
    fontWeight: block.bioFontWeight
      ? block.bioFontWeight === "bold"
        ? 700
        : block.bioFontWeight === "semibold"
          ? 600
          : block.bioFontWeight === "medium"
            ? 500
            : 400
      : "var(--zx-bio-weight, 400)",
    fontFamily: block.bioFontFamily,
    letterSpacing: block.bioLetterSpacing != null ? `${block.bioLetterSpacing}px` : undefined,
    lineHeight: block.bioLineHeight ?? undefined,
    color: block.bioColor,
    display: block.bioMaxLines ? "-webkit-box" : undefined,
    WebkitBoxOrient: block.bioMaxLines ? ("vertical" as const) : undefined,
    WebkitLineClamp: block.bioMaxLines,
    overflow: block.bioMaxLines ? "hidden" : undefined,
  };

  const textCluster = (
    <div className={cn("relative", isSplit ? "min-w-0 flex-1" : "space-y-0.5")}>
      <div
        className={cn(
          "flex items-center gap-1",
          layout === "center" && "justify-center",
          layout === "right" && "justify-end",
          layout === "left" && "justify-start",
          isSplit && "justify-start",
        )}
        style={nameStyle}
      >
        <span>{block.displayName}</span>
        {badgePos === "inline" && badgeEl}
      </div>
      {block.username && <div className="text-xs text-muted-foreground">@{block.username}</div>}
      {block.location && (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {block.location}
        </div>
      )}
      {block.bio && (
        <div className="mt-1 text-muted-foreground" style={bioStyle}>
          {block.bio}
        </div>
      )}
      {block.shortDescription && (
        <div className="mt-1 text-[11px] text-muted-foreground/80">{block.shortDescription}</div>
      )}
    </div>
  );

  const avatarWithBadge = (
    <div className="relative inline-block">
      {avatar}
      {badgePos !== "inline" && badgeEl}
    </div>
  );

  // Spotlight mouse tracking (only when spotlight card effect is active)
  const spotlightHandlers =
    block.effects?.card?.effect === "spotlight" && !fx.disabled
      ? {
          onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
            const t = e.currentTarget as HTMLDivElement;
            const r = t.getBoundingClientRect();
            t.style.setProperty("--zx-mx", `${((e.clientX - r.left) / r.width) * 100}%`);
            t.style.setProperty("--zx-my", `${((e.clientY - r.top) / r.height) * 100}%`);
          },
        }
      : {};

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        hasBg && "rounded-2xl",
        fx.cardClass,
      )}
      style={{ ...bgStyle, ...fx.cardStyle }}
      {...spotlightHandlers}
    >
      {/* Video BG (unchanged) */}
      {bgType === "video" && block.bgVideoUrl && (() => {
        const embed = buildEmbed(block.bgVideoUrl, { background: true });
        if (!embed) return null;
        if (embed.kind === "video") {
          return (
            <div
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ filter: bgMediaFilter }}
            >
              <AutoplayVideo
                src={embed.src}
                poster={block.bgImageUrl}
                background
                className="h-full w-full"
              />
            </div>
          );
        }
        return (
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ filter: bgMediaFilter }}
          >
            <iframe
              src={embed.src}
              title="Background video"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute left-1/2 top-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 border-0"
              style={{ minWidth: "177.78vh", minHeight: "56.25vw" }}
            />
          </div>
        );
      })()}

      {/* New BG effect layer */}
      {!fx.disabled && fx.bgOverlayClass && (
        <div className={cn("zx-hero-bg-layer", fx.bgOverlayClass)} aria-hidden />
      )}

      {overlay}

      <div
        className={cn(
          "relative py-4",
          hasBg && "px-4",
          isSplit ? "flex flex-row items-center gap-4" : cn("flex flex-col gap-3", alignItems),
        )}
      >
        {block.coverUrl && !isSplit && bgType === "none" && (
          <div
            className="-mx-5 -mt-10 mb-2 w-[calc(100%+2.5rem)] overflow-hidden bg-muted"
            style={{ height: "var(--zx-cover-h, 96px)" }}
          >
            <img src={block.coverUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {avatarWithBadge}
        {textCluster}
      </div>
    </div>
  );
}



// ── Custom Code ──────────────────────────────────────────────────────────
function CustomCodeRender({ block }: { block: CustomCodeBlock }) {
  const mode = useRendererMode();
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>(block.minHeight ?? 120);
  const [visible, setVisible] = useState<boolean>(!block.lazy);
  const [allowJs, setAllowJs] = useState<boolean>(false);

  const hasContent =
    !!(block.html && block.html.trim()) ||
    !!(block.css && block.css.trim()) ||
    !!(block.js && block.js.trim());


  // Fetch workspace-level JS toggle once (public — the sanitizer strips
  // <script> unless the workspace has explicitly opted-in).
  useEffect(() => {
    let live = true;
    // Public renderer: read via anon client is fine because it's a boolean flag.
    // If unavailable we default to off.
    (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        // find the workspace id via URL? For safety default to disabled.
        // Renderer preview inside the builder reads the block as-is.
        setAllowJs(false);
        void supabase;
      } catch {
        if (live) setAllowJs(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Lazy-render via IntersectionObserver
  useEffect(() => {
    if (!block.lazy || visible) return;
    const el = ref.current?.parentElement;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [block.lazy, visible]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data as { __zxcc?: boolean; height?: number } | undefined;
      if (!d || !d.__zxcc || typeof d.height !== "number") return;
      if (e.source !== ref.current?.contentWindow) return;
      setHeight(Math.max(block.minHeight ?? 60, Math.ceil(d.height)));
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [block.minHeight]);

  let buildError: string | null = null;
  let srcDoc = "";
  if (visible && hasContent) {
    try {
      srcDoc = buildSrcDoc({
        html: block.html ?? "",
        css: block.css ?? "",
        js: block.js ?? "",
        allowJs: allowJs && !!block.jsEnabled,
        design: block.design,
      });
    } catch (err) {
      buildError = err instanceof Error ? err.message : "Could not process this HTML.";
      srcDoc = "";
    }
  }

  const maxWidth =
    block.containerWidth === "narrow"
      ? 480
      : block.containerWidth === "wide"
        ? 960
        : undefined;

  if (!hasContent) {
    if (mode === "public") return null;
    return (
      <div
        className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground"
        data-builder-only="true"
      >
        <div className="font-medium text-foreground">Custom Code block</div>
        <div className="mt-1">Insert HTML, an embed, or pick a preset from the right panel.</div>
      </div>
    );
  }

  if (buildError) {
    if (mode === "public") return null;
    return (
      <div
        className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-xs text-destructive"
        data-builder-only="true"
      >
        <div className="font-medium">Custom Code couldn't be rendered</div>
        <div className="mt-1 break-words opacity-80">{buildError}</div>
      </div>
    );
  }

  const jsBlocked = !!block.js?.trim() && !(allowJs && block.jsEnabled);


  return (
    <div
      style={{
        maxWidth,
        marginInline: maxWidth ? "auto" : undefined,
        borderRadius: block.borderRadius ?? 0,
        overflow: "hidden",
      }}
    >
      <iframe
        ref={ref}
        title={block.title || "Custom Code"}
        sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
        srcDoc={srcDoc}
        loading={block.lazy ? "lazy" : "eager"}
        style={{
          width: "100%",
          height,
          border: 0,
          background: "transparent",
          display: "block",
        }}
      />
      {jsBlocked && mode !== "public" && (
        <div
          className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300"
          data-builder-only="true"
        >
          JavaScript in this block is disabled for safety — the HTML and CSS still render.
        </div>
      )}

    </div>
  );
}
