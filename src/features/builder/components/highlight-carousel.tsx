import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HighlightCardsBlock } from "../types";

/**
 * Highlight Cards carousel engine.
 *
 * Previously this was a hand-rolled `translateX` pager: it only listened for
 * touchstart/touchend, so mouse drag, trackpad, wheel, keyboard and autoplay
 * never worked. It now runs on Embla, which is the same engine used elsewhere
 * in the app, and behaves identically in the builder preview and on the
 * published page (the editor guard exempts `[data-zx-interactive]`).
 */
export function HighlightCarousel({
  block,
  perView,
  gap,
  renderCard,
}: {
  block: HighlightCardsBlock;
  /** Cards visible at once for the active viewport. */
  perView: number;
  /** CSS gap between slides. */
  gap: string;
  renderCard: (index: number) => React.ReactNode;
}) {
  const cards = block.cards ?? [];
  const loop = block.carouselLoop !== false && cards.length > perView;
  const drag = block.carouselDrag !== false;
  const showArrows = block.carouselArrows !== false;
  const showDots = block.carouselDots !== false;

  const autoplayOn = block.carouselAutoplay === true && cards.length > perView;
  const [emblaRef, embla] = useEmblaCarousel(
    {
      loop,
      align: "start",
      containScroll: loop ? false : "trimSnaps",
      slidesToScroll: 1,
      duration: Math.max(8, Math.min(80, block.carouselSpeed ?? 28)),
      watchDrag: drag,
      dragFree: false,
      skipSnaps: false,
    },
    autoplayOn
      ? [
          Autoplay({
            delay: Math.max(1000, block.carouselAutoplayDelay ?? 4000),
            stopOnInteraction: false,
            stopOnMouseEnter: block.carouselPauseOnHover !== false,
            stopOnFocusIn: true,
            playOnInit: true,
          }),
        ]
      : [],
  );

  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    setSnaps(embla.scrollSnapList());
    sync();
    embla.on("select", sync).on("reInit", () => {
      setSnaps(embla.scrollSnapList());
      sync();
    });
    return () => {
      embla.off("select", sync);
    };
  }, [embla, sync]);

  // Settings changes (perView, gap, loop…) must rebuild the engine geometry.
  useEffect(() => {
    embla?.reInit();
  }, [embla, perView, gap, loop, cards.length]);

  // Optional wheel navigation — horizontal intent only, so vertical page
  // scrolling over the carousel is never hijacked.
  useEffect(() => {
    if (!embla || block.carouselWheel !== true) return;
    const node = embla.rootNode();
    let locked = 0;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = Date.now();
      if (now - locked < 260) return;
      locked = now;
      if (e.deltaX > 0) embla.scrollNext();
      else embla.scrollPrev();
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [embla, block.carouselWheel]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (block.carouselKeyboard === false || !embla) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      embla.scrollPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      embla.scrollNext();
    }
  };

  const basis = `calc((100% - ${perView - 1} * ${gap}) / ${perView})`;

  return (
    <div
      // Marks the whole carousel as interactive so the builder's click guard
      // lets drag / arrows / dots through inside the editor canvas.
      data-zx-interactive=""
      className="relative isolate"
      role="region"
      aria-roledescription="carousel"
      aria-label={block.title || "Highlight cards"}
      tabIndex={block.carouselKeyboard === false ? -1 : 0}
      onKeyDown={onKeyDown}
      onPointerDownCapture={(e) => {
        // Stop propagation to prevent dnd-kit or parent editor guards from 
        // capturing the start of a drag interaction.
        e.stopPropagation();
        
        if (block.carouselPauseOnTouch === false) return;
        const ap = embla?.plugins()?.autoplay;
        ap?.stop?.();
      }}
    >
      {/* Viewport — overflow hidden is required by Embla to measure slides. */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div
          className="flex items-stretch"
          style={{
            gap,
            // Avoids the browser stealing horizontal gestures on touch.
            touchAction: drag ? "pan-y pinch-zoom" : undefined,
            backfaceVisibility: "hidden",
          }}
        >
          {cards.map((c, i) => (
            <div
              key={c.id}
              className="min-w-0 shrink-0 grow-0"
              style={{ flex: `0 0 ${basis}`, willChange: "transform" }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${cards.length}`}
            >
              {renderCard(i)}
            </div>
          ))}
        </div>
      </div>

      {false && showArrows && cards.length > perView && (
        <>
          <button
            type="button"
            aria-label="Previous cards"
            onClick={(e) => {
              e.stopPropagation();
              embla?.scrollPrev();
            }}
            disabled={!loop && !canPrev}
            className="absolute left-1 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border bg-background/85 backdrop-blur transition disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next cards"
            onClick={(e) => {
              e.stopPropagation();
              embla?.scrollNext();
            }}
            disabled={!loop && !canNext}
            className="absolute right-1 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border bg-background/85 backdrop-blur transition disabled:opacity-35"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {false && showDots && snaps.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === selected}
              onClick={(e) => {
                e.stopPropagation();
                embla?.scrollTo(i);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === selected ? "w-5 bg-foreground/70" : "w-1.5 bg-foreground/25",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
