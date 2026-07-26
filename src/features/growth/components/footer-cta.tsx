import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Heart } from "lucide-react";
import type { GrowthEngineSettings } from "../types";
import { industryCta, type Industry } from "../industry";
import { trackGrowthEvent } from "../track";

interface Props {
  settings: GrowthEngineSettings;
  industry: Industry;
}

/** Footer conversion CTA + optional referral CTA. Renders inline (no popup). */
export function FooterCta({ settings, industry }: Props) {
  const href = settings.redirect_url || "/signup";
  const industryCopy = settings.dynamic_industry_cta_enabled ? industryCta(industry) : null;

  return (
    <div className="mt-10 flex w-full flex-col gap-4">
      {settings.footer_cta_enabled ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onViewportEnter={() => trackGrowthEvent("branding_view", { source: "footer_cta" })}
          className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background: `radial-gradient(120% 80% at 100% 0%, ${settings.accent_color}22, transparent 55%), radial-gradient(120% 80% at 0% 100%, #ec489922, transparent 55%)`,
            }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: settings.accent_color }} />
              <p className="text-[13px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                {settings.footer_headline}
              </p>
            </div>
            <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
              {industryCopy ?? settings.footer_subtext}
            </p>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGrowthEvent("footer_cta_click", { industry })}
              className="group inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${settings.accent_color}, #ec4899)`,
              }}
            >
              {settings.footer_cta_label}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </motion.section>
      ) : null}

      {settings.referral_cta_enabled ? (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-zinc-300 px-4 py-3 dark:border-zinc-700"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-zinc-900 dark:text-zinc-50">
              <Heart className="h-3.5 w-3.5" style={{ color: settings.accent_color }} />
              <span className="truncate">{settings.referral_headline}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {settings.referral_subtext}
            </p>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGrowthEvent("referral_click", { industry })}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-zinc-300 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-zinc-900 backdrop-blur transition-colors hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            {settings.referral_cta_label}
            <ArrowRight className="h-3 w-3" />
          </a>
        </motion.section>
      ) : null}
    </div>
  );
}
