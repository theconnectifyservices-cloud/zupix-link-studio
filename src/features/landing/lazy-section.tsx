import { Suspense, lazy, useEffect, useRef, useState, type ComponentType } from "react";

/** Mount a heavy section only when it's near the viewport. Preserves layout via min-height. */
export function LazySection({
  loader,
  minHeight = 600,
  rootMargin = "800px 0px",
}: {
  loader: () => Promise<{ default: ComponentType }>;
  minHeight?: number;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (!visible || Comp) return;
    let cancelled = false;
    loader().then((m) => {
      if (!cancelled) setComp(() => m.default);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, Comp, loader]);

  return (
    <div
      ref={ref}
      style={{
        minHeight: Comp ? undefined : minHeight,
        contentVisibility: "auto",
        containIntrinsicSize: `${minHeight}px`,
      }}
    >
      {Comp ? (
        <Suspense fallback={<div style={{ minHeight }} />}>
          <Comp />
        </Suspense>
      ) : null}
    </div>
  );
}
