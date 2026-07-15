import { useEffect, useRef, useState } from "react";

interface Args {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

interface Range {
  start: number;
  end: number;
  offsetTop: number;
  totalHeight: number;
}

/**
 * Windowed virtual list for large datasets on desktop. Pure math — bring your
 * own scroll container via the returned ref.
 */
export function useVirtualList<T extends HTMLElement>({
  itemCount,
  itemHeight,
  overscan = 6,
}: Args): { ref: React.RefObject<T | null>; range: Range } {
  const ref = useRef<T | null>(null);
  const [range, setRange] = useState<Range>({
    start: 0,
    end: Math.min(itemCount, 20),
    offsetTop: 0,
    totalHeight: itemCount * itemHeight,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const scrollTop = el.scrollTop;
      const viewport = el.clientHeight;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(itemCount, Math.ceil((scrollTop + viewport) / itemHeight) + overscan);
      setRange({
        start,
        end,
        offsetTop: start * itemHeight,
        totalHeight: itemCount * itemHeight,
      });
    };
    compute();
    el.addEventListener("scroll", compute, { passive: true });
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", compute);
      ro.disconnect();
    };
  }, [itemCount, itemHeight, overscan]);

  return { ref, range };
}
