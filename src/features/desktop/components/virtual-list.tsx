import type { ReactNode } from "react";
import { useVirtualList } from "../hooks/use-virtual-list";

interface Props<T> {
  items: T[];
  itemHeight: number;
  render: (item: T, index: number) => ReactNode;
  className?: string;
  overscan?: number;
  emptyState?: ReactNode;
}

/** Simple virtualized list for large desktop datasets. */
export function VirtualList<T>({
  items,
  itemHeight,
  render,
  className,
  overscan = 8,
  emptyState,
}: Props<T>) {
  const { ref, range } = useVirtualList<HTMLDivElement>({
    itemCount: items.length,
    itemHeight,
    overscan,
  });

  if (!items.length && emptyState) return <>{emptyState}</>;

  const slice = items.slice(range.start, range.end);
  return (
    <div ref={ref} className={className ?? "relative h-full overflow-auto"}>
      <div style={{ height: range.totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${range.offsetTop}px)` }}>
          {slice.map((item, i) => (
            <div key={range.start + i} style={{ height: itemHeight }}>
              {render(item, range.start + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
