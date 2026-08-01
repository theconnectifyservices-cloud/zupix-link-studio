import { useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import type { GrowthEngineSettings } from "../types";
import { trackGrowthEvent } from "../track";
import { FLOATING_BASE_BOTTOM, useFloatingStackOffset } from "@/components/floating-stack";

interface Props {
  settings: GrowthEngineSettings;
  /** Compact badge = smaller, subtext hidden (paid plans that opt into a badge only). */
  compact?: boolean;
  plan?: string;
}

/** Bottom-right glass badge. Sticky, mobile responsive, tasteful. */
export function FloatingBadge({ settings, compact = false, plan }: Props) {
  const href = settings.redirect_url || "/pricing";
  const ref = useRef<HTMLAnchorElement | null>(null);
  // Stacks above the contact widget / back-to-top / third-party chat bubbles.
  const stackOffset = useFloatingStackOffset(ref, { side: "bottom-right", priority: 2 });

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 1.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => trackGrowthEvent("branding_click", { source: "floating_badge", compact, plan })}
      onViewportEnter={() =>
        trackGrowthEvent("branding_view", { source: "floating_badge", compact, plan })
      }
      ref={ref}
      data-zx-floating="bottom-right"
      data-zx-floating-priority={2}
      className={`group fixed bottom-20 right-4 z-[60] inline-flex max-w-[calc(100vw-2rem)] items-center rounded-full p-[1.5px] backdrop-blur-xl [--zx-float-inset:20px] [@media(min-width:768px)]:right-5 [@media(min-width:1024px)]:right-6 [@media(min-width:1024px)]:[--zx-float-inset:24px] ${
        compact
          ? "gap-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.14)]"
          : "gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      }`}
      style={{
        background: `linear-gradient(135deg, ${settings.accent_color}, #ec4899 55%, #f59e0b)`,
        bottom: stackOffset > 0 ? `calc(${FLOATING_BASE_BOTTOM} + ${stackOffset}px)` : FLOATING_BASE_BOTTOM,
      }}
      aria-label={compact ? settings.badge_text : `${settings.badge_text} — ${settings.badge_subtext}`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-40 blur-xl transition-opacity group-hover:opacity-70"
        style={{ background: settings.accent_color }}
        aria-hidden
      />
      <span
        className={`relative flex items-center rounded-full bg-white/85 backdrop-blur-xl dark:bg-zinc-900/85 ${
          compact ? "gap-1.5 px-3 py-1.5" : "gap-2 px-3.5 py-2"
        }`}
      >
        <span
          className={`grid place-items-center rounded-full text-white shadow-sm ${
            compact ? "h-5 w-5" : "h-6 w-6"
          }`}
          style={{ background: `linear-gradient(135deg, ${settings.accent_color}, #ec4899)` }}
        >
          <Sparkles className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </span>
        {compact ? (
          <span className="block text-[11px] font-semibold text-zinc-900 dark:text-zinc-50">
            {settings.badge_text}
          </span>
        ) : (
          <>
            <span className="hidden text-[11px] leading-tight sm:block">
              <span className="block font-semibold text-zinc-900 dark:text-zinc-50">{settings.badge_text}</span>
              <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                {settings.badge_subtext}
              </span>
            </span>
            <span className="block text-[11px] font-semibold text-zinc-900 dark:text-zinc-50 sm:hidden">
              ZUPIX
            </span>
          </>
        )}
        <ArrowRight
          className={`text-zinc-500 transition-transform group-hover:translate-x-0.5 dark:text-zinc-400 ${
            compact ? "h-3 w-3" : "h-3.5 w-3.5"
          }`}
        />
      </span>

    </motion.a>
  );
}
