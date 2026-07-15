import { useEffect, useRef, useState } from "react";

interface Options {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

/**
 * Pull-to-refresh gesture for a scrollable container.
 * Returns a ref for the scroll container and current pull distance for the indicator.
 */
export function usePullToRefresh<T extends HTMLElement>({
  onRefresh,
  threshold = 70,
  disabled,
}: Options) {
  const ref = useRef<T | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (el.scrollTop > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        setPull(Math.min(dy * 0.5, threshold * 1.5));
      }
    };
    const onTouchEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      if (pull >= threshold) {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
      setPull(0);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, threshold, disabled, pull, refreshing]);

  return { ref, pull, refreshing, progress: Math.min(pull / threshold, 1) };
}
