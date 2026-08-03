import { cn } from "@/lib/utils";
import type { BusinessCardStyle } from "@/features/builder/types";

/** Shared premium surface for all three Business Tools blocks. */
export function businessSurface(style: BusinessCardStyle | undefined): string {
  switch (style) {
    case "solid":
      return "bg-card border shadow-sm";
    case "outline":
      return "bg-transparent border-2";
    case "glass":
    default:
      return "border border-white/15 bg-card/60 shadow-lg backdrop-blur-xl supports-[backdrop-filter]:bg-card/40";
  }
}

export function BusinessCard({
  style,
  radius,
  className,
  children,
}: {
  style?: BusinessCardStyle;
  radius?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("zx-biz-card overflow-hidden transition-all", businessSurface(style), className)}
      style={{ borderRadius: radius ?? 18 }}
    >
      {children}
    </div>
  );
}

export function BusinessHeader({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  if (!title && !description) return null;
  return (
    <div className="mb-4 space-y-1">
      {title && <h3 className="text-base font-semibold leading-tight">{title}</h3>}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
