import { useCallback, useRef } from "react";

export function useLongPress<E extends HTMLElement>(
  onLongPress: (e: React.PointerEvent<E>) => void,
  { ms = 500 }: { ms?: number } = {},
) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent<E>) => {
      triggered.current = false;
      timer.current = setTimeout(() => {
        triggered.current = true;
        onLongPress(e);
      }, ms);
    },
    [onLongPress, ms],
  );

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
  };
}
