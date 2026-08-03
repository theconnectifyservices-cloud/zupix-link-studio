import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const PREFERS_REDUCED =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Count-up + fade price display.
 * Renders the final value on the server and on first client render (no hydration mismatch),
 * then animates only on subsequent value changes. Uses tabular numerals and a fixed
 * line box so switching cycles causes no layout shift.
 */
export function AnimatedPrice({
  value,
  format,
  className,
}: {
  /** Target amount in major units (e.g. rupees). */
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      fromRef.current = value;
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    if (from === value || PREFERS_REDUCED) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const duration = 500;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = Math.round(from + (value - from) * easeOutCubic(t));
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <span className={cn("tabular-nums transition-opacity duration-300", className)}>
      {format(display)}
    </span>
  );
}
