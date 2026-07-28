/**
 * THE single pricing component for ZUPIX Link Studio.
 * Used by the landing page, /pricing, upgrade flows and any plan preview.
 * Pricing data always comes from `@/features/subscription/plans`.
 */
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CircleCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PLANS, PLAN_ORDER, formatPlanPrice, yearlySavingsPct, type PlanCode,
} from "@/features/subscription/plans";
import { WaitlistForm } from "@/features/subscription/components/waitlist-form";
import { SubscriptionCheckoutLauncher } from "@/features/billing/components/subscription-checkout-launcher";
import { useSession } from "@/features/auth/hooks/use-session";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";

export type BillingCycle = "monthly" | "yearly";

export function trackPricing(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (typeof w.gtag === "function") w.gtag("event", event, props);
  if (typeof w.plausible === "function") w.plausible(event, { props });
}

/** Shared plan-selection behaviour (free → app/auth, tejas → checkout). */
export function usePlanCta(cycle: BillingCycle) {
  const [checkout, setCheckout] = useState<{ planCode: PlanCode } | null>(null);
  const session = useSession();
  const { workspace } = useCurrentWorkspace();
  const navigate = useNavigate();
  const authed = session.status === "authenticated";

  function handleCta(code: PlanCode) {
    trackPricing("plan_click", { plan: code, cycle });
    if (code === "shikhar") return;
    if (code === "udaan") {
      trackPricing("trial_start", { source: "pricing_udaan" });
      navigate({ to: authed ? "/app" : "/auth" });
      return;
    }
    trackPricing("checkout_started", { plan: code, cycle });
    if (!authed) {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("zupix:auth_intent", "trial");
      }
      navigate({ to: "/auth", search: { mode: "signup" } });
      return;
    }
    setCheckout({ planCode: code });
  }

  const launcher =
    checkout && workspace ? (
      <SubscriptionCheckoutLauncher
        open={!!checkout}
        onOpenChange={(v) => { if (!v) setCheckout(null); }}
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        planCode={checkout.planCode}
        cycle={cycle}
      />
    ) : null;

  return { handleCta, launcher };
}

export function CycleToggle({
  cycle, onChange, savingsHint,
}: {
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
  savingsHint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative inline-flex items-center gap-1 rounded-full border bg-card/70 p-1 backdrop-blur">
        {(["monthly", "yearly"] as const).map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={cn(
              "relative z-10 rounded-full px-5 py-1.5 text-sm font-medium capitalize transition-colors",
              cycle === c ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {cycle === c && (
              <motion.span
                layoutId="cycle-pill"
                className="absolute inset-0 -z-10 rounded-full bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            {c}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {cycle === "yearly" && savingsHint && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            🎉 {savingsHint}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingCard({
  code, cycle, index, onCta,
}: {
  code: PlanCode;
  cycle: BillingCycle;
  index: number;
  onCta: (code: PlanCode) => void;
}) {
  const plan = PLANS[code];
  const priceMinor = cycle === "monthly" ? plan.priceMonthlyMinor : plan.priceYearlyMinor;
  const savings = yearlySavingsPct(plan);
  const isFeatured = code === "tejas";
  const isShikhar = code === "shikhar";
  const monthEquiv = cycle === "yearly" && plan.priceMonthlyMinor > 0
    ? Math.round(plan.priceYearlyMinor / 12 / 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={cn(
        "group relative flex flex-col rounded-3xl border bg-card/70 p-6 backdrop-blur-xl transition",
        isFeatured
          ? "border-primary/40 shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.45)] md:-translate-y-3 md:scale-[1.02]"
          : "hover:border-foreground/20 hover:shadow-xl",
      )}
    >
      {isFeatured && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 via-transparent to-purple-500/15" />
      )}
      {plan.badge && (
        <div className={cn(
          "absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider shadow-md",
          isFeatured
            ? "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground"
            : "border bg-card text-muted-foreground",
        )}>
          {plan.badge}
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-3xl">{plan.emoji}</span>
        <div>
          <div className="text-lg font-semibold">{plan.name}</div>
          <div className="text-xs text-muted-foreground">{plan.tagline}</div>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2">
        {priceMinor > 0 ? (
          <>
            <span className="text-5xl font-bold tracking-tight">{formatPlanPrice(priceMinor)}</span>
            <span className="mb-1 text-sm text-muted-foreground">/ {cycle === "monthly" ? "month" : "year"}</span>
          </>
        ) : (
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-4xl font-bold text-transparent">
            Free Forever
          </span>
        )}
      </div>
      {monthEquiv !== null && (
        <div className="mt-1 text-xs text-muted-foreground">
          ≈ ₹{monthEquiv}/mo · save {savings}%
        </div>
      )}
      {isShikhar && (
        <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          Launching soon · join the waitlist
        </div>
      )}

      <ul className="mt-6 space-y-2.5 text-sm">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <CircleCheck className={cn("mt-0.5 h-4 w-4 shrink-0",
              isFeatured ? "text-primary" : "text-emerald-500")} />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-2">
        {isShikhar ? (
          <WaitlistForm planCode="shikhar" />
        ) : (
          <Button
            size="lg"
            className={cn(
              "w-full gap-2",
              isFeatured &&
                "bg-gradient-to-r from-primary to-purple-600 shadow-lg shadow-primary/30 hover:brightness-110",
            )}
            variant={isFeatured ? "default" : code === "udaan" ? "outline" : "default"}
            onClick={() => onCta(code)}
          >
            {isFeatured && <Zap className="h-4 w-4" />}
            {code === "udaan" ? "Start Free" : "Start 3-Day Free Trial"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {isFeatured && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            No credit card required · cancel anytime
          </p>
        )}
      </div>
    </motion.div>
  );
}

export function PricingCards({
  cycle, onCta,
}: {
  cycle: BillingCycle;
  onCta: (code: PlanCode) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {PLAN_ORDER.map((code, i) => (
        <PricingCard key={code} code={code} cycle={cycle} index={i} onCta={onCta} />
      ))}
    </div>
  );
}

/**
 * Drop-in pricing block used on every surface.
 * `withHeader` renders the eyebrow/title/subtitle (landing page usage).
 */
export function PricingSection({
  id = "pricing",
  withHeader = true,
  defaultCycle = "yearly",
  className,
}: {
  id?: string;
  withHeader?: boolean;
  defaultCycle?: BillingCycle;
  className?: string;
}) {
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle);
  const { handleCta, launcher } = usePlanCta(cycle);
  const tejasSavings = PLANS.tejas.priceMonthlyMinor * 12 - PLANS.tejas.priceYearlyMinor;

  return (
    <section id={id} className={cn("relative scroll-mt-24 py-20 sm:py-28", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {withHeader && (
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Pricing
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-5xl">
              Choose the Right Plan for Your{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Business
              </span>
            </h2>
            <p className="mt-4 text-pretty text-base text-muted-foreground">
              Start free with Udaan. Upgrade anytime to unlock premium business tools —
              custom domains, commerce, analytics and the full Studio.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <CycleToggle
            cycle={cycle}
            onChange={(c) => { setCycle(c); trackPricing("toggle_usage", { cycle: c }); }}
            savingsHint={`Save ₹${(tejasSavings / 100).toFixed(0)} per year`}
          />
        </div>

        <div className="mt-12">
          <PricingCards cycle={cycle} onCta={handleCta} />
        </div>
      </div>
      {launcher}
    </section>
  );
}
