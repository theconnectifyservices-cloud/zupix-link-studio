import { cn } from "@/lib/utils";
import type { HighlightCard, HighlightCardsBlock } from "../types";
import { useRendererMode } from "../renderer-mode";
import { HighlightCarousel } from "./highlight-carousel";

const GAP: Record<string, string> = { sm: "8px", md: "14px", lg: "22px" };
const SHADOW: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.08)",
  md: "0 4px 12px rgba(0,0,0,.10)",
  lg: "0 10px 24px rgba(0,0,0,.14)",
  xl: "0 20px 45px rgba(0,0,0,.20)",
};

/** Very small allowlist sanitizer for inline SVG icons. */
function sanitizeSvg(raw: string): string | null {
  const src = (raw ?? "").trim();
  if (!src.toLowerCase().startsWith("<svg")) return null;
  return src
    .replace(/<\s*(script|foreignObject|iframe)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, "");
}

function cardSurface(block: HighlightCardsBlock, card: HighlightCard) {
  const style = block.cardStyle ?? "solid";
  const bg = card.bgColor ?? block.bgColor;
  const base: React.CSSProperties = {
    borderRadius: `${block.radius ?? 16}px`,
    boxShadow: SHADOW[block.shadow ?? "md"] ?? SHADOW.md,
    color: card.textColor ?? block.textColor,
    border: block.border === false ? "none" : `1px solid ${block.borderColor ?? "hsl(var(--border))"}`,
  };
  if (style === "gradient") {
    base.background = `linear-gradient(135deg, ${block.gradientFrom ?? "#6366f1"}, ${
      block.gradientTo ?? "#ec4899"
    })`;
    if (!card.textColor && !block.textColor) base.color = "#fff";
  } else if (style === "glass") {
    base.background = bg ?? "rgba(255,255,255,0.10)";
    base.backdropFilter = "blur(12px)";
    (base as Record<string, string>).WebkitBackdropFilter = "blur(12px)";
    base.border = block.border === false ? "none" : "1px solid rgba(255,255,255,0.28)";
  } else if (style === "outline") {
    base.background = "transparent";
  } else {
    base.background = bg ?? "hsl(var(--card))";
  }
  return base;
}

function CardIcon({ card, size }: { card: HighlightCard; size: number }) {
  const kind = card.iconKind ?? (card.imageUrl ? "image" : card.emoji ? "emoji" : "none");
  if (kind === "none") return null;
  if (kind === "image" && card.imageUrl) {
    return (
      <img
        src={card.imageUrl}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: size, height: size }}
        className="shrink-0 rounded-lg object-contain"
      />
    );
  }
  if (kind === "svg" && card.svg) {
    const safe = sanitizeSvg(card.svg);
    if (!safe) return null;
    return (
      <span
        className="zx-hc-svg inline-flex shrink-0 items-center justify-center"
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }
  if (card.emoji) {
    return (
      <span
        className="shrink-0 leading-none"
        style={{ fontSize: size * 0.8, lineHeight: 1 }}
        role="img"
        aria-hidden
      >
        {card.emoji}
      </span>
    );
  }
  return null;
}

function CardBody({
  block,
  card,
  index,
}: {
  block: HighlightCardsBlock;
  card: HighlightCard;
  index: number;
}) {
  const mode = useRendererMode();
  const align = block.align ?? "center";
  const anim = block.animation && block.animation !== "none" ? block.animation : null;
  const hover = block.hover && block.hover !== "none" ? block.hover : null;

  const inner = (
    <div
      className={cn(
        "flex h-full flex-col gap-2 p-4 transition-all",
        align === "center" ? "items-center text-center" : "items-start text-left",
        anim && `zx-anim zx-anim-${anim}`,
        hover && `zx-hover zx-hover-${hover}`,
      )}
      style={{
        ...cardSurface(block, card),
        ...({ "--zx-anim-delay": `${index * 70}ms` } as React.CSSProperties),
      }}
    >
      <CardIcon card={card} size={block.iconSize ?? 34} />
      <div className="text-sm font-semibold leading-snug">{card.title || "Untitled"}</div>
      {card.description && (
        <div className="text-xs leading-relaxed opacity-80">{card.description}</div>
      )}
    </div>
  );

  if (card.url && mode === "public") {
    return (
      <a
        href={card.url}
        target={card.newTab === false ? undefined : "_blank"}
        rel="noopener noreferrer"
        className="block h-full no-underline"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

export function HighlightCardsRender({
  block,
  viewport = "mobile",
}: {
  block: HighlightCardsBlock;
  viewport?: "mobile" | "tablet" | "desktop";
}) {
  const cards = block.cards ?? [];
  const gap = GAP[block.gap ?? "md"] ?? GAP.md;
  const layout = block.layout ?? "grid";

  const cols =
    viewport === "mobile"
      ? (block.columnsMobile ?? 1)
      : viewport === "tablet"
        ? (block.columnsTablet ?? 2)
        : (block.columns ?? 3);

  // Mobile auto-scroll: many cards on a small screen become a swipe rail.
  // The carousel layout has its own touch engine, so it is never downgraded.
  const autoScrollMobile =
    layout !== "carousel" &&
    viewport === "mobile" &&
    block.mobileScroll !== false &&
    cards.length > 2;

  const header = (block.title || block.subtitle) && (
    <div className={cn("mb-3", (block.align ?? "center") === "center" ? "text-center" : "text-left")}>
      {block.title && <div className="text-base font-semibold">{block.title}</div>}
      {block.subtitle && (
        <div className="mt-0.5 text-xs text-muted-foreground">{block.subtitle}</div>
      )}
    </div>
  );

  if (cards.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        No highlight cards yet — add one or pick a preset.
      </div>
    );
  }

  let body: React.ReactNode;

  if (layout === "carousel") {
    body = (
      <HighlightCarousel
        block={block}
        perView={Math.max(1, Math.min(cols, cards.length))}
        gap={gap}
        renderCard={(i) => <CardBody block={block} card={cards[i]} index={i} />}
      />
    );
  } else if (layout === "scroll" || autoScrollMobile) {
    body = (
      <div
        className="zx-hc-rail -mx-1 flex snap-x snap-mandatory overflow-x-auto px-1 pb-2"
        style={{ gap, scrollbarWidth: "none" }}
      >
        {cards.map((c, i) => (
          <div
            key={c.id}
            className="shrink-0 snap-start"
            style={{ width: viewport === "mobile" ? "72%" : "240px" }}
          >
            <CardBody block={block} card={c} index={i} />
          </div>
        ))}
      </div>
    );
  } else if (layout === "masonry") {
    body = (
      <div style={{ columnCount: cols, columnGap: gap }}>
        {cards.map((c, i) => (
          <div key={c.id} style={{ breakInside: "avoid", marginBottom: gap }}>
            <CardBody block={block} card={c} index={i} />
          </div>
        ))}
      </div>
    );
  } else if (layout === "centered") {
    body = (
      <div className="flex flex-wrap items-stretch justify-center" style={{ gap }}>
        {cards.map((c, i) => (
          <div
            key={c.id}
            style={{ width: viewport === "mobile" ? "100%" : `calc(${100 / cols}% - ${gap})` }}
          >
            <CardBody block={block} card={c} index={i} />
          </div>
        ))}
      </div>
    );
  } else {
    body = (
      <div
        className="grid items-stretch"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}
      >
        {cards.map((c, i) => (
          <CardBody key={c.id} block={block} card={c} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      {header}
      {body}
    </div>
  );
}
