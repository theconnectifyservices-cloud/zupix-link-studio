import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "../hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";

interface Props {
  onRefresh: () => void | Promise<void>;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

/** Scrollable container with pull-to-refresh on touch devices. */
export function PullToRefresh({ onRefresh, children, className, disabled }: Props) {
  const { ref, pull, refreshing, progress } = usePullToRefresh<HTMLDivElement>({
    onRefresh,
    disabled,
  });

  return (
    <div ref={ref} className={cn("relative overflow-auto overscroll-contain", className)}>
      <div
        aria-hidden={!refreshing && pull === 0}
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center"
        style={{ height: pull, opacity: refreshing ? 1 : progress }}
      >
        <RefreshCw
          className={cn("h-5 w-5 text-muted-foreground", refreshing && "animate-spin")}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: refreshing ? "none" : "transform 150ms" }}>
        {children}
      </div>
    </div>
  );
}
