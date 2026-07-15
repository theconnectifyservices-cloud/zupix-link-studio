import { useEffect, useState, type CSSProperties } from "react";
import type {
  Block,
  BlockSettings,
  ContactBlock,
  CountdownBlock,
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
import { cn } from "@/lib/utils";
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

const SOCIAL_ICON: Record<SocialPlatform, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
  threads: AtSign,
  linkedin: Linkedin,
  pinterest: ImageIcon,
  telegram: Send,
  whatsapp: MessageCircle,
  github: Github,
  twitter: Twitter,
  website: Globe,
  custom: LinkIcon,
};

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
  const btnFx =
    block.type === "button" || block.type === "buttonGroup"
      ? s.buttonEffect && s.buttonEffect !== "none"
        ? s.buttonEffect
        : null
      : null;

  const wrapCls = cn(
    s.radius && RADIUS_CLASS[s.radius],
    anim !== "none" && `zx-anim zx-anim-${anim}`,
    hover && `zx-hover zx-hover-${hover}`,
    btnFx && `zx-btn-fx zx-btn-fx-${btnFx}`,
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
    !!paddingX ||
    !!paddingY ||
    !!marginTop ||
    !!marginBottom ||
    !!s.radius ||
    anim !== "none" ||
    !!hover ||
    !!btnFx ||
    (fontScale && fontScale !== 1);

  const inner = renderInner(block);
  if (!hasWrap) return inner;
  return (
    <div
      className={wrapCls}
      style={style}
      data-block-id={block.id}
      data-block-type={block.type}
      data-hide-mobile={vis.mobile === false || undefined}
      data-hide-tablet={vis.tablet === false || undefined}
      data-hide-desktop={vis.desktop === false || undefined}
    >
      {inner}
    </div>
  );
}

function renderInner(block: Block) {
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
      return <ButtonRender block={block} />;
    }

    case "buttonGroup":
      return <ButtonGroupRender block={block} />;

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
      if (block.links.length === 0) {
        return <div className="text-center text-xs text-muted-foreground">No social links yet</div>;
      }
      return (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {block.links.map((l) => {
            const Icon = SOCIAL_ICON[l.platform] ?? Globe;
            return (
              <span
                key={l.id}
                className="grid h-9 w-9 place-items-center rounded-full bg-muted text-foreground"
                aria-label={l.label || l.platform}
              >
                <Icon className="h-4 w-4" />
              </span>
            );
          })}
        </div>
      );

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
    case "embed":
      return <EmbedRender block={block} />;

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
function ButtonRender({ block }: { block: ButtonBlock }) {
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
    backdropFilter: "blur(0)",
  };
  return (
    <div className={cn("flex", ALIGN_WRAP[block.align ?? "center"])}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all hover:-translate-y-0.5",
          WIDTH_CLASS[block.width ?? "full"],
          block.disabled && "cursor-not-allowed opacity-50 hover:translate-y-0",
        )}
        style={style}
      >
        {block.label || "Button"}
      </div>
    </div>
  );
}

// ── Button group ─────────────────────────────────────────────────────────
function ButtonGroupRender({ block }: { block: ButtonGroupBlock }) {
  if (block.buttons.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        No buttons yet
      </div>
    );
  }
  const cls =
    block.layout === "horizontal"
      ? "flex flex-wrap gap-2"
      : block.layout === "grid"
        ? `grid gap-2 grid-cols-${block.columns ?? 2}`
        : "flex flex-col gap-2";
  return (
    <div className={cls}>
      {block.buttons.map((b) => {
        const v =
          b.style === "outline"
            ? "border border-foreground/30 text-foreground"
            : b.style === "soft"
              ? "bg-muted text-foreground"
              : "bg-foreground text-background";
        return (
          <div
            key={b.id}
            className={cn(
              "rounded-full px-4 py-2.5 text-center text-sm font-medium",
              v,
              block.layout === "vertical" && "w-full",
            )}
          >
            {b.label}
          </div>
        );
      })}
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
    return (
      <video
        src={block.url}
        controls
        muted={block.muted}
        loop={block.loop}
        autoPlay={block.autoplay}
        poster={block.thumbnailUrl}
        className={cn("aspect-video w-full bg-black", roundedCls)}
      />
    );
  }
  const params = new URLSearchParams();
  if (block.autoplay) params.set("autoplay", "1");
  if (block.muted) params.set("mute", "1");
  if (block.loop) params.set("loop", "1");
  let src = "";
  if (block.provider === "youtube") {
    const id = extractYouTubeId(block.url);
    if (!id)
      return (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          Invalid YouTube URL
        </div>
      );
    src = `https://www.youtube.com/embed/${id}?${params.toString()}`;
  } else {
    const id = extractVimeoId(block.url);
    if (!id)
      return (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          Invalid Vimeo URL
        </div>
      );
    src = `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }
  return (
    <div className={cn("aspect-video w-full overflow-hidden bg-black", roundedCls)}>
      <iframe
        src={src}
        className="h-full w-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────
function GalleryRender({ block }: { block: GalleryBlock }) {
  const [preview, setPreview] = useState<string | null>(null);
  const rounded =
    block.rounded === "lg"
      ? "rounded-xl"
      : block.rounded === "md"
        ? "rounded-lg"
        : block.rounded === "sm"
          ? "rounded"
          : "rounded-none";
  const gap = block.gap === "lg" ? "gap-4" : block.gap === "sm" ? "gap-1" : "gap-2";
  if (block.images.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        Add gallery images
      </div>
    );
  }
  if (block.layout === "carousel") {
    return (
      <div className={cn("flex snap-x snap-mandatory overflow-x-auto", gap)}>
        {block.images.map((img) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt ?? ""}
            className={cn("h-40 w-40 shrink-0 cursor-pointer snap-start object-cover", rounded)}
            onClick={() => setPreview(img.url)}
          />
        ))}
        {preview && <LightBox url={preview} onClose={() => setPreview(null)} />}
      </div>
    );
  }
  if (block.layout === "masonry") {
    const cols = block.columns ?? 2;
    return (
      <div className={cn("columns-2", cols === 3 && "columns-3", cols === 4 && "columns-4", gap)}>
        {block.images.map((img) => (
          <img
            key={img.id}
            src={img.url}
            alt={img.alt ?? ""}
            className={cn("mb-2 w-full cursor-pointer break-inside-avoid object-cover", rounded)}
            onClick={() => setPreview(img.url)}
          />
        ))}
        {preview && <LightBox url={preview} onClose={() => setPreview(null)} />}
      </div>
    );
  }
  const cols = block.columns ?? 2;
  const gridCols = cols === 4 ? "grid-cols-4" : cols === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={cn("grid", gridCols, gap)}>
      {block.images.map((img) => (
        <img
          key={img.id}
          src={img.url}
          alt={img.alt ?? ""}
          className={cn("aspect-square w-full cursor-pointer object-cover", rounded)}
          onClick={() => setPreview(img.url)}
        />
      ))}
      {preview && <LightBox url={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
function LightBox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <img src={url} alt="" className="max-h-full max-w-full rounded" />
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
  return (
    <div className="space-y-3">
      {block.title && <div className="text-center text-sm font-semibold">{block.title}</div>}
      {block.items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No testimonials
        </div>
      ) : (
        block.items.map((t) => (
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
  return (
    <div className="space-y-2">
      {block.title && <div className="text-sm font-semibold">{block.title}</div>}
      {block.items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
          No questions
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {block.items.map((it) => (
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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(block.target).getTime();
  const diff = target - now;
  if (isNaN(target)) {
    return (
      <div className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">
        Set a target date
      </div>
    );
  }
  if (diff <= 0) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center">
        <div className="text-sm font-semibold">{block.finishedLabel || "We're live!"}</div>
      </div>
    );
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
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
            <div className="text-lg font-bold tabular-nums">{String(n).padStart(2, "0")}</div>
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

// ── Profile block with theme.profile effects (LS-07C) ────────────────────
function ProfileRender({ block }: { block: Extract<Block, { type: "profile" }> }) {
  const theme = useBuilderStore((s) => s.content.theme);
  const prof = theme?.profile ?? DEFAULT_PROFILE;
  const avatarFxCls = cn(
    prof.avatarGlow && "zx-avatar-glow",
    prof.avatarRing && "zx-avatar-ring",
    prof.avatarRotatingRing && "zx-avatar-rotating-ring",
    prof.avatarFloating && "zx-avatar-floating",
  );
  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      {block.coverUrl && (
        <div
          className="-mx-5 -mt-10 mb-2 w-[calc(100%+2.5rem)] overflow-hidden bg-muted"
          style={{ height: "var(--zx-cover-h, 96px)" }}
        >
          <img src={block.coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div
        className={cn(
          "grid place-items-center overflow-hidden bg-muted text-2xl font-semibold text-muted-foreground",
          avatarFxCls,
        )}
        style={{
          width: "var(--zx-avatar-size, 80px)",
          height: "var(--zx-avatar-size, 80px)",
          borderRadius: "var(--zx-avatar-radius, 9999px)",
          border: "var(--zx-avatar-border-w, 4px) solid var(--zx-avatar-border-c, #fff)",
        }}
      >
        {block.avatarUrl ? (
          <img src={block.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          (block.displayName ?? "?").charAt(0).toUpperCase()
        )}
      </div>
      <div className="relative space-y-0.5">
        <div
          className="flex items-center justify-center gap-1"
          style={{
            fontSize: "var(--zx-name-size, 18px)",
            fontWeight: "var(--zx-name-weight, 700)",
            fontFamily: "var(--zx-heading-family)",
            textTransform: "var(--zx-text-transform, none)" as CSSProperties["textTransform"],
          }}
        >
          <span>{block.displayName}</span>
          {block.verified && (
            <BadgeCheck
              className={cn("h-4 w-4 text-primary", prof.badgeAnimation && "zx-badge-anim")}
            />
          )}
        </div>
        {block.username && <div className="text-xs text-muted-foreground">@{block.username}</div>}
        {block.location && (
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {block.location}
          </div>
        )}
        {block.bio && (
          <div
            className="mt-1 text-muted-foreground"
            style={{
              fontSize: "var(--zx-bio-size, 12px)",
              fontWeight: "var(--zx-bio-weight, 400)",
            }}
          >
            {block.bio}
          </div>
        )}
        {block.shortDescription && (
          <div className="mt-1 text-[11px] text-muted-foreground/80">{block.shortDescription}</div>
        )}
      </div>
    </div>
  );
}
