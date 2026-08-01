import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

const SHOW_AFTER_PX = 500;
const SCROLL_DURATION_MS = 500;
const RING_SIZE = 56;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Global floating "Back to top" control.
 *
 * Mounted once in the root route, so every page gets it without duplicate
 * listeners. Uses a single passive scroll listener driven through rAF.
 */
export function GlobalBackToTop({ enabledOnBioPages = false }: { enabledOnBioPages?: boolean }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const animation = useRef<number | null>(null);

  // Public bio pages render their own floating widgets — opt-in only.
  const isBioPage = useRouterState({
    select: (s) => s.matches.some((m) => m.routeId === "/$slug"),
  });

  useEffect(() => {
    const read = () => {
      frame.current = null;
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const max =
        (document.documentElement.scrollHeight || 0) - window.innerHeight;
      setVisible(y > SHOW_AFTER_PX);
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
    };

    const onScroll = () => {
      if (frame.current !== null) return;
      frame.current = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      if (animation.current !== null) window.cancelAnimationFrame(animation.current);
    };
  }, []);

  const scrollToTop = () => {
    const start = window.scrollY || document.documentElement.scrollTop || 0;
    if (start <= 0) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      window.scrollTo(0, 0);
      return;
    }

    const startTime = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / SCROLL_DURATION_MS);
      window.scrollTo(0, Math.round(start * (1 - easeInOutCubic(t))));
      animation.current = t < 1 ? window.requestAnimationFrame(step) : null;
    };
    if (animation.current !== null) window.cancelAnimationFrame(animation.current);
    animation.current = window.requestAnimationFrame(step);
  };

  if (isBioPage && !enabledOnBioPages) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      aria-hidden={!visible}
      data-zx-floating={visible ? "bottom-right" : undefined}
      data-zx-floating-priority={1}
      tabIndex={visible ? 0 : -1}
      onClick={scrollToTop}
      className={cn(
        "group fixed right-4 bottom-20 z-40 grid h-12 w-12 place-items-center rounded-full",
        "border border-primary-foreground/20 bg-primary/80 text-primary-foreground backdrop-blur-md",
        "bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30",
        "transition-all duration-300 ease-out will-change-transform",
        "hover:scale-[1.08] hover:shadow-xl hover:shadow-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "lg:right-6 lg:bottom-6 lg:h-14 lg:w-14",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-primary-foreground/20"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          className="text-primary-foreground transition-[stroke-dashoffset] duration-150 ease-linear"
        />
      </svg>
      <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 lg:h-6 lg:w-6" />
    </button>
  );
}

export default GlobalBackToTop;
