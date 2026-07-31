/**
 * Gallery renderer — grid / masonry / carousel with lightbox.
 *
 * Works identically in the builder, preview and published site:
 *  • No `window` / `document` access during render (SSR + hydration safe).
 *  • Autoplay, swipe and keyboard handlers are installed in effects only.
 *  • In builder mode interactive affordances are disabled so clicks select
 *    the block instead of navigating / opening the lightbox.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRendererMode } from "../renderer-mode";
import type { GalleryBlock, GalleryImage } from "../types";

const GAP_PX = { sm: 4, md: 8, lg: 16 } as const;

const ROUNDED_CLS = {
  none: "rounded-none",
  sm: "rounded",
  md: "rounded-lg",
  lg: "rounded-xl",
} as const;

function roundedClass(v: GalleryBlock["rounded"]) {
  return ROUNDED_CLS[v ?? "md"] ?? ROUNDED_CLS.md;
}

function gapPx(v: GalleryBlock["gap"]) {
  return GAP_PX[v ?? "md"] ?? GAP_PX.md;
}

/** Distribute items across N columns (round-robin keeps visual balance). */
function toColumns<T>(items: T[], count: number): T[][] {
  const cols: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, i) => cols[i % count].push(item));
  return cols;
}

/** Column count that adapts to the container width. */
function useResponsiveColumns(max: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [cols, setCols] = useState(max);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const apply = (w: number) => {
      let next = max;
      if (w < 360) next = Math.min(max, 2);
      if (w < 240) next = 1;
      if (w >= 640) next = max;
      setCols(Math.max(1, next));
    };
    apply(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => apply(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [max]);

  return { ref, cols };
}

interface GalleryProps {
  block: GalleryBlock;
}

export function GalleryRender({ block }: GalleryProps) {
  const mode = useRendererMode();
  const interactive = mode === "public";
  const images = useMemo(() => (block.images ?? []).filter((i) => i && i.url), [block.images]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = useCallback(
    (index: number) => {
      if (!interactive || block.lightbox === false) return;
      setLightboxIndex(index);
    },
    [interactive, block.lightbox],
  );

  if (images.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        Add gallery images
      </div>
    );
  }

  const common = {
    block,
    images,
    interactive,
    onOpen: openLightbox,
  };

  return (
    <>
      {block.layout === "carousel" ? (
        <CarouselLayout {...common} />
      ) : block.layout === "masonry" ? (
        <MasonryLayout {...common} />
      ) : (
        <GridLayout {...common} />
      )}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Image                                                                      */
/* -------------------------------------------------------------------------- */

function GalleryImg({
  img,
  className,
  eager,
  onClick,
  clickable,
}: {
  img: GalleryImage;
  className?: string;
  eager?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}) {
  return (
    <img
      src={img.url}
      alt={img.alt ?? ""}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn(
        "block bg-muted/40 transition-transform duration-300",
        clickable && "cursor-zoom-in hover:scale-[1.02]",
        className,
      )}
      onClick={onClick}
    />
  );
}

interface LayoutProps {
  block: GalleryBlock;
  images: GalleryImage[];
  interactive: boolean;
  onOpen: (i: number) => void;
}

/* -------------------------------------------------------------------------- */
/*  Grid                                                                       */
/* -------------------------------------------------------------------------- */

function GridLayout({ block, images, interactive, onOpen }: LayoutProps) {
  const max = block.columns ?? 2;
  const { ref, cols } = useResponsiveColumns(max);
  const gap = gapPx(block.gap);

  return (
    <div
      ref={ref}
      className="grid w-full"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap }}
    >
      {images.map((img, i) => (
        <GalleryImg
          key={img.id ?? i}
          img={img}
          eager={i < cols}
          clickable={interactive && block.lightbox !== false}
          onClick={() => onOpen(i)}
          className={cn("aspect-square w-full object-cover", roundedClass(block.rounded))}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Masonry                                                                    */
/* -------------------------------------------------------------------------- */

function MasonryLayout({ block, images, interactive, onOpen }: LayoutProps) {
  const max = block.columns ?? 2;
  const { ref, cols } = useResponsiveColumns(max);
  const gap = gapPx(block.gap);
  const columns = useMemo(() => toColumns(images, cols), [images, cols]);

  return (
    <div ref={ref} className="flex w-full items-start" style={{ gap }}>
      {columns.map((col, ci) => (
        <div key={ci} className="flex min-w-0 flex-1 flex-col" style={{ gap }}>
          {col.map((img) => {
            const index = images.indexOf(img);
            return (
              <GalleryImg
                key={img.id ?? index}
                img={img}
                eager={index < cols}
                clickable={interactive && block.lightbox !== false}
                onClick={() => onOpen(index)}
                className={cn("h-auto w-full object-cover", roundedClass(block.rounded))}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Carousel                                                                   */
/* -------------------------------------------------------------------------- */

function CarouselLayout({ block, images, interactive, onOpen }: LayoutProps) {
  const count = images.length;
  const loop = block.loop !== false;
  const autoplay = block.autoplay !== false && interactive && count > 1;
  const speed = Math.max(1500, block.autoplaySpeed ?? 4000);
  const showArrows = block.showArrows !== false && count > 1;
  const showDots = block.showDots !== false && count > 1;
  const rounded = roundedClass(block.rounded);

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ x: number; active: boolean } | null>(null);

  const go = useCallback(
    (target: number) => {
      if (count === 0) return;
      setIndex(loop ? (target + count) % count : Math.min(count - 1, Math.max(0, target)));
    },
    [count, loop],
  );

  const prev = useCallback(() => go(index - 1), [go, index]);
  const next = useCallback(() => go(index + 1), [go, index]);

  // clamp when images shrink
  useEffect(() => {
    setIndex((i) => (i >= count ? 0 : i));
  }, [count]);

  // autoplay
  useEffect(() => {
    if (!autoplay || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (loop ? (i + 1) % count : Math.min(count - 1, i + 1)));
    }, speed);
    return () => window.clearInterval(id);
  }, [autoplay, paused, speed, count, loop]);

  // keyboard nav (only when the carousel has focus)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  // touch / pointer swipe
  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    drag.current = { x: e.clientX, active: true };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!interactive || !drag.current?.active) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden"
      tabIndex={interactive ? 0 : -1}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image gallery"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className={cn("flex w-full transition-transform duration-500 ease-out", rounded)}
        style={{ transform: `translate3d(-${index * 100}%, 0, 0)` }}
      >
        {images.map((img, i) => (
          <div key={img.id ?? i} className="w-full shrink-0 grow-0 basis-full">
            <GalleryImg
              img={img}
              eager={i === 0}
              clickable={interactive && block.lightbox !== false}
              onClick={() => onOpen(i)}
              className={cn("aspect-video w-full object-cover", rounded)}
            />
          </div>
        ))}
      </div>

      {showArrows && interactive && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {showDots && (
        <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index}
              disabled={!interactive}
              onClick={() => go(i)}
              className={cn(
                "h-1.5 rounded-full bg-white/50 transition-all",
                i === index ? "w-5 bg-white" : "w-1.5",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lightbox                                                                   */
/* -------------------------------------------------------------------------- */

function Lightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const hydrated = useHydrated();
  const [zoom, setZoom] = useState(1);
  const img = images[index];

  useEffect(() => setZoom(1), [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % images.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + images.length) % images.length);
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, z + 0.25));
      if (e.key === "-") setZoom((z) => Math.max(1, z - 0.25));
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, images.length, onClose, onIndex]);

  if (!hydrated || !img) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      onWheel={(e) => setZoom((z) => Math.min(4, Math.max(1, z - Math.sign(e.deltaY) * 0.2)))}
    >
      <img
        src={img.url}
        alt={img.alt ?? ""}
        onClick={(e) => e.stopPropagation()}
        style={{ transform: `scale(${zoom})` }}
        className="max-h-[85vh] max-w-full rounded object-contain transition-transform duration-200"
      />

      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + images.length) % images.length);
            }}
            className="absolute left-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % images.length);
            }}
            className="absolute right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <div
        className="absolute bottom-4 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20"
        >
          <Plus className="h-4 w-4" />
        </button>
        <span className="ml-2 text-xs opacity-70">
          {index + 1} / {images.length}
        </span>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
