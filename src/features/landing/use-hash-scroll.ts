import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

let timer = 0;

/** Scroll to an element id, re-correcting while lazy sections mount and shift layout. */
export function scrollToHashTarget(id: string, offset = 80) {
  if (typeof window === "undefined" || !id) return;
  window.clearTimeout(timer);

  let attempts = 0;

  const tick = () => {
    const el = document.getElementById(id);
    if (el) {
      const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
      // Compare against the real scroll position so clamped scrolls are retried
      // once lazily-mounted sections have grown the document.
      if (Math.abs(window.scrollY - top) > 2) {
        window.scrollTo({ top, behavior: attempts === 0 ? "smooth" : "auto" });
      }
    }
    attempts += 1;
    if (attempts < 60) timer = window.setTimeout(tick, 150);
  };
  tick();
}

/**
 * Scrolls to the active hash target. Works for in-app hash links, direct loads
 * and browser back/forward navigation.
 */
export function useHashScroll(offset = 80) {
  const hash = useLocation({ select: (l) => l.hash });

  useEffect(() => {
    const id = (hash || window.location.hash).replace(/^#/, "");
    if (id) scrollToHashTarget(id, offset);
  }, [hash, offset]);

  useEffect(() => {
    const onHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (id) scrollToHashTarget(id, offset);
    };
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
    };
  }, [offset]);
}
