import { useEffect, useState } from "react";

/**
 * Shared stacking system for fixed bottom-anchored widgets (branding badge,
 * contact widget, back-to-top, third-party chat widgets, cookie banners).
 *
 * Any ZUPIX floating widget marks itself with:
 *   data-zx-floating="bottom-right" | "bottom-left"
 *   data-zx-floating-priority="<number>"  (lower = closer to the bottom edge)
 *
 * A widget calls `useFloatingStackOffset` to learn how many pixels it must be
 * pushed up so it never overlaps a lower-priority widget or any other
 * fixed element pinned to the bottom of the viewport.
 */

export const FLOATING_GAP = 12;

export type FloatingSide = "bottom-right" | "bottom-left";

/**
 * Base bottom inset, safe-area aware. Browsers without `env()` support drop
 * this declaration entirely and fall back to the `bottom-20` (80px) class.
 */
export const FLOATING_BASE_BOTTOM =
  "calc(env(safe-area-inset-bottom, 0px) + var(--zx-float-inset, 20px))";

function isBottomFixed(el: Element, viewportH: number) {
  const style = window.getComputedStyle(el);
  if (style.position !== "fixed" && style.position !== "sticky") return null;
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  // Only widgets anchored to the lower third of the viewport participate.
  if (rect.bottom < viewportH * 0.6 || rect.top > viewportH) return null;
  return rect;
}

/**
 * Returns the extra bottom offset (px) this widget needs so it clears every
 * other bottom-anchored element on the same side.
 */
export function useFloatingStackOffset(
  selfRef: React.RefObject<HTMLElement | null>,
  options: { side: FloatingSide; priority: number },
) {
  const { side, priority } = options;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let frame = 0;

    const measure = () => {
      const self = selfRef.current;
      if (!self) return;
      const viewportH = window.innerHeight;
      const selfRect = self.getBoundingClientRect();
      const selfCenterX = selfRect.left + selfRect.width / 2;
      let needed = 0;

      const candidates = document.querySelectorAll<HTMLElement>("body *");
      candidates.forEach((el) => {
        if (el === self || self.contains(el) || el.contains(self)) return;

        const marker = el.dataset["zxFloating"] as FloatingSide | undefined;
        if (marker) {
          if (marker !== side) return;
          const otherPriority = Number(el.dataset["zxFloatingPriority"] ?? 0);
          // Only stack above widgets that sit closer to the bottom edge.
          if (otherPriority >= priority) return;
        }

        const rect = isBottomFixed(el, viewportH);
        if (!rect) return;

        if (!marker) {
          // Unknown third-party widget: only avoid it when it horizontally
          // overlaps this widget (chat bubbles) or spans the full width
          // (cookie banners / bottom toolbars).
          const spansWidth = rect.width > window.innerWidth * 0.8;
          const overlapsX = rect.left <= selfCenterX && rect.right >= selfCenterX;
          if (!spansWidth && !overlapsX) return;
          // Ignore anything larger than half the viewport height (overlays).
          if (rect.height > viewportH * 0.5) return;
        }

        needed = Math.max(needed, viewportH - rect.top + FLOATING_GAP);
      });

      setOffset((prev) => (Math.abs(prev - needed) > 1 ? needed : prev));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    schedule();
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("orientationchange", schedule, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(schedule, 1000);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.removeEventListener("scroll", schedule);
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [selfRef, side, priority]);

  return offset;
}
