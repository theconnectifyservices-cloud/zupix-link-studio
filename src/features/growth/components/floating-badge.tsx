import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import type { GrowthEngineSettings } from "../types";
import { trackGrowthEvent } from "../track";

interface Props {
  settings: GrowthEngineSettings;
}

/** Bottom-right glass badge. Sticky, mobile responsive, tasteful. */
export function FloatingBadge({ settings }: Props) {
  const href = settings.redirect_url || "/signup";
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
      onClick={() => trackGrowthEvent("branding_click", { source: "floating_badge" })}
      onViewportEnter={() => trackGrowthEvent("branding_view", { source: "floating_badge" })}
      className="group fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2.5 rounded-full p-[1.5px] shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:bottom-6 sm:right-6"
      style={{
        background: `linear-gradient(135deg, ${settings.accent_color}, #ec4899 55%, #f59e0b)`,
      }}
      aria-label={`${settings.badge_text} — ${settings.badge_subtext}`}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full opacity-40 blur-xl transition-opacity group-hover:opacity-70"
        style={{ background: settings.accent_color }}
        aria-hidden
      />
      <span className="relative flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-2 backdrop-blur-xl dark:bg-zinc-900/85">
        <span
          className="grid h-6 w-6 place-items-center rounded-full text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${settings.accent_color}, #ec4899)` }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="hidden text-[11px] leading-tight sm:block">
          <span className="block font-semibold text-zinc-900 dark:text-zinc-50">{settings.badge_text}</span>
          <span className="block text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            {settings.badge_subtext}
          </span>
        </span>
        <span className="block text-[11px] font-semibold text-zinc-900 dark:text-zinc-50 sm:hidden">
          ZUPIX
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:translate-x-0.5 dark:text-zinc-400" />
      </span>
    </motion.a>
  );
}
