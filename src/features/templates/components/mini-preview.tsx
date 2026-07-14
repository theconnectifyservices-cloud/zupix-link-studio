/**
 * Compact preview of a template. Renders a phone-shaped card whose
 * inner surface reads from the same CSS variables the live builder
 * uses (`--zx-*`), so what you see here is what the page renders.
 *
 * A real BlockRenderer preview would be heavier and require the full
 * builder store; a mock avatar + button trio conveys the design at a
 * fraction of the cost.
 */

import { useMemo } from "react";
import { themeToCssVars } from "@/features/builder/theme";
import type { Template } from "../types";
import { cn } from "@/lib/utils";

interface Props {
  template: Template;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Show the phone chrome (default true). */
  frame?: boolean;
}

export function MiniPreview({ template, className, size = "md", frame = true }: Props) {
  const style = useMemo(() => themeToCssVars(template.theme, "mobile"), [template]);
  const isDark = template.theme.mode === "dark";

  const scale = size === "sm" ? "text-[8px]" : size === "lg" ? "text-[11px]" : "text-[9px]";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        frame ? "rounded-2xl border shadow-sm" : "rounded-xl",
        isDark ? "border-white/10" : "border-black/10",
        className,
      )}
      style={{
        background: (style as Record<string, string>)["--zx-bg"] as string | undefined,
        aspectRatio: "9 / 16",
      }}
    >
      <div
        className={cn("flex h-full w-full flex-col items-center gap-2 p-3", scale)}
        style={style}
      >
        {/* Avatar */}
        <div
          className="mt-2 h-10 w-10 shrink-0 rounded-full"
          style={{
            background: "var(--primary)",
            border: "2px solid var(--border)",
            boxShadow: "var(--zx-card-shadow, 0 2px 6px rgba(0,0,0,0.08))",
          }}
        />
        {/* Name */}
        <div
          className="font-semibold"
          style={{ color: "var(--foreground)", fontFamily: "var(--zx-heading-family)" }}
        >
          Your Name
        </div>
        <div className="opacity-70" style={{ color: "var(--muted-foreground)" }}>
          @yourhandle
        </div>

        {/* Buttons */}
        <div className="mt-2 flex w-full flex-col gap-1.5">
          {["Link one", "Link two", "Link three"].map((label, i) => (
            <div
              key={i}
              className="w-full truncate px-2 py-1.5 text-center font-medium"
              style={{
                background: "var(--zx-btn-bg)",
                color: "var(--zx-btn-fg)",
                border: "var(--zx-btn-border)",
                borderRadius: "var(--zx-btn-radius, 12px)",
                boxShadow: "var(--zx-btn-shadow, none)",
                fontFamily: "var(--zx-btn-font)",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Card sample */}
        <div
          className="mt-auto w-full p-1.5"
          style={{
            background: "var(--zx-card-bg)",
            border: "var(--zx-card-border)",
            borderRadius: "var(--zx-card-radius, 8px)",
            color: "var(--foreground)",
          }}
        >
          <div className="opacity-80">Say hi 👋</div>
        </div>
      </div>
    </div>
  );
}
