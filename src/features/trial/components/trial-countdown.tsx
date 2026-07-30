/**
 * TrialCountdown: compact chip for the topbar and expanded card for
 * dashboards. Reads live from useTrial + ticking countdown.
 */
import { Clock, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTrial, useTrialCountdown, useUpgrade } from "../hooks";

interface Props {
  variant?: "chip" | "card" | "banner";
  className?: string;
}

export function TrialCountdown({ variant = "chip", className }: Props) {
  const { data } = useTrial();
  const c = useTrialCountdown();
  const { openUpgrade } = useUpgrade();

  if (!data) return null;

  // Expired state -> upgrade banner
  if (data.status === "trial_expired") {
    if (variant === "chip") {
      return (
        <button
          onClick={() => openUpgrade({ suggestedPlan: "tejas", reason: "Your trial has ended" })}
          className={cn(
            "hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition",
            className,
          )}
        >
          <Zap className="h-3 w-3" />
          Trial ended · Upgrade
        </button>
      );
    }
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5 p-5",
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Your Tejas trial has ended</div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Premium blocks are locked. Your data is safe — upgrade any time to restore full access.
            </p>
            <Button size="sm" className="mt-3 gap-1.5" onClick={() => openUpgrade({ suggestedPlan: "tejas" })}>
              <Sparkles className="h-3.5 w-3.5" />
              Upgrade to Tejas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!c || !data.isTrialing) return null;

  const urgent = data.status === "trial_ending_soon";

  if (variant === "chip") {
    const compact =
      c.days > 0 ? `${c.days}d` : c.hours > 0 ? `${c.hours}h` : `${c.minutes}m`;
    const full =
      c.days > 0
        ? `${c.days}d ${c.hours}h left`
        : c.hours > 0
          ? `${c.hours}h ${c.minutes}m left`
          : `${c.minutes}m ${c.seconds}s left`;
    const tone = urgent
      ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
      : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20";

    return (
      <>
        {/* Mobile: perfectly round glass badge */}
        <button
          type="button"
          aria-label={`Trial: ${full}`}
          onClick={() => openUpgrade({ suggestedPlan: "tejas", reason: "Keep Tejas after your trial" })}
          className={cn(
            "inline-grid h-10 w-10 shrink-0 place-items-center rounded-full border leading-none backdrop-blur transition sm:hidden",
            tone,
            className,
          )}
        >
          <span className="flex flex-col items-center justify-center gap-px text-center">
            <Clock className="h-3 w-3" aria-hidden />
            <span className="text-[10px] font-semibold tabular-nums leading-none">{compact}</span>
          </span>
        </button>

        {/* Desktop: pill */}
        <button
          type="button"
          onClick={() => openUpgrade({ suggestedPlan: "tejas", reason: "Keep Tejas after your trial" })}
          className={cn(
            "hidden min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium backdrop-blur transition sm:inline-flex",
            tone,
            className,
          )}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {full}
          <span className="hidden md:inline text-muted-foreground/70">· Trial</span>
        </button>
      </>
    );
  }


  const units: Array<{ label: string; value: number }> = [
    { label: "Days", value: c.days },
    { label: "Hours", value: c.hours },
    { label: "Minutes", value: c.minutes },
    { label: "Seconds", value: c.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 backdrop-blur",
        urgent
          ? "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5"
          : "border-primary/30 bg-gradient-to-br from-primary/10 via-background to-purple-500/5",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-40">
        <div
          className={cn(
            "absolute -left-16 -top-16 h-48 w-48 rounded-full blur-3xl",
            urgent ? "bg-amber-500/30" : "bg-primary/30",
          )}
        />
      </div>
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" />
            {urgent ? "Trial ending soon" : "Tejas trial active"}
          </div>
          <h3 className="mt-2 text-lg font-semibold">
            {urgent ? "Hurry — keep Tejas unlocked" : "Your 3-day Tejas trial"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {urgent
              ? "Upgrade now to keep FAQs, Forms, Custom Domain & branding removal."
              : "All Tejas features are unlocked. Countdown below shows when the trial ends."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {units.map((u) => (
            <div
              key={u.label}
              className={cn(
                "min-w-[54px] rounded-xl border bg-background/70 px-2 py-2 text-center backdrop-blur",
                urgent && "border-amber-500/40",
              )}
            >
              <div className="text-lg font-bold tabular-nums">{String(u.value).padStart(2, "0")}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{u.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => openUpgrade({ suggestedPlan: "tejas" })}>
          <Zap className="h-3.5 w-3.5" />
          Upgrade to Tejas
        </Button>
        <span className="text-xs text-muted-foreground">Cancel anytime. Your data stays.</span>
      </div>
    </motion.div>
  );
}
