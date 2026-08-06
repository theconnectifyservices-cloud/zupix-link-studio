/**
 * Premium glassmorphic Upgrade Modal — the app-wide paywall surface.
 * Renders 3-plan pricing with monthly/yearly toggle. Shikhar is
 * coming-soon with an inline waitlist form.
 */
import { useState } from "react";
import { Check, Sparkles, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  PLANS,
  PLAN_ORDER,
  formatPlanPrice,
  yearlySavingsPct,
  type PlanCode,
} from "../plans";
import { useSubscriptionUI } from "../store";
import { usePlan } from "../hooks";
import { WaitlistForm } from "./waitlist-form";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { SubscriptionCheckoutLauncher } from "@/features/billing/components/subscription-checkout-launcher";
import { CouponInput } from "@/features/trial/components/coupon-input";
import { TrialCountdown } from "@/features/trial";

export function UpgradeModal() {
  const { upgradeOpen, upgradeContext, closeUpgrade } = useSubscriptionUI();
  const { code: currentPlan } = usePlan();
  const { workspace } = useCurrentWorkspace();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const [checkout, setCheckout] = useState<{ planCode: PlanCode } | null>(null);

  return (
    <Dialog open={upgradeOpen} onOpenChange={(o) => !o && closeUpgrade()}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-5xl touch-pan-y overflow-y-auto overscroll-contain border-none bg-transparent p-0 shadow-2xl sm:max-h-[90dvh]">
        <div className="relative rounded-2xl border bg-background/80 backdrop-blur-xl">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-purple-500/25 blur-3xl" />
          </div>


          <div className="relative px-6 py-8 sm:px-10 sm:py-10">
            <div className="mx-auto max-w-2xl text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3 w-3" />
                {upgradeContext.reason ?? "Upgrade to unlock more power"}
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Choose your plan
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Start free with Udaan. Grow with Tejas. Reach the summit with Shikhar.
              </p>

              <div className="mt-6 inline-flex items-center gap-1 rounded-full border bg-card p-1">
                {(["monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-xs font-medium capitalize transition",
                      cycle === c
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                    {c === "yearly" && (
                      <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        SAVE UP TO 27%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {PLAN_ORDER.map((code) => (
                <PlanCard
                  key={code}
                  code={code}
                  cycle={cycle}
                  currentPlan={currentPlan}
                  suggested={upgradeContext.suggestedPlan}
                  onUpgrade={() => setCheckout({ planCode: code })}
                />
              ))}
            </div>

            <div className="mx-auto mt-6 max-w-md">
              <TrialCountdown variant="card" />
              <div className="mt-3">
                <CouponInput planCode="tejas" cycle={cycle} amountMinor={cycle === "yearly" ? PLANS.tejas.priceYearlyMinor : PLANS.tejas.priceMonthlyMinor} />
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              All prices in INR. GST extra where applicable. Cancel anytime.
            </p>
          </div>
        </div>
      </DialogContent>

      {checkout && workspace ? (
        <SubscriptionCheckoutLauncher
          open={!!checkout}
          onOpenChange={(v) => { if (!v) { setCheckout(null); closeUpgrade(); } }}
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          planCode={checkout.planCode}
          cycle={cycle}
        />
      ) : null}
    </Dialog>
  );
}

function PlanCard({
  code,
  cycle,
  currentPlan,
  suggested,
  onUpgrade,
}: {
  code: PlanCode;
  cycle: "monthly" | "yearly";
  currentPlan: PlanCode;
  suggested?: PlanCode;
  onUpgrade?: () => void;
}) {
  const plan = PLANS[code];
  const isCurrent = currentPlan === code;
  const isSuggested = suggested === code;
  const priceMinor = cycle === "monthly" ? plan.priceMonthlyMinor : plan.priceYearlyMinor;
  const savings = yearlySavingsPct(plan);
  const [waitlist, setWaitlist] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border bg-card/90 p-6 backdrop-blur",
        isSuggested && "border-primary/60 shadow-lg shadow-primary/20 ring-1 ring-primary/40",
        isCurrent && !isSuggested && "border-emerald-500/40",
      )}
    >
      {plan.badge && (
        <div
          className={cn(
            "absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md bg-gradient-to-r",
            plan.gradient,
          )}
        >
          {plan.badge}
        </div>
      )}

      <div className={cn("grid h-11 w-11 place-items-center rounded-xl text-2xl bg-gradient-to-br", plan.gradient)}>
        <span>{plan.emoji}</span>
      </div>

      <div className="mt-4">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="mt-5">
        {plan.comingSoon ? (
          <div>
            <div className="text-2xl font-bold text-muted-foreground">Launching soon</div>
            <div className="mt-1 text-xs text-muted-foreground">Join the waitlist for early access.</div>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight">{formatPlanPrice(priceMinor, plan.currency)}</span>
            {priceMinor > 0 && (
              <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? "mo" : "yr"}</span>
            )}
            {cycle === "yearly" && savings > 0 && (
              <span className="ml-2 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                SAVE {code === "shikhar" ? "23" : savings}%
              </span>
            )}
          </div>
        )}
      </div>

      <ul className="mt-5 space-y-2.5 text-sm">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex-1" />

      <AnimatePresence mode="wait">
        {plan.comingSoon ? (
          waitlist ? (
            <motion.div key="wl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <WaitlistForm planCode={code} />
            </motion.div>
          ) : (
            <motion.div key="wl-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button variant="outline" className="w-full" onClick={() => setWaitlist(true)}>
                Join Waitlist
              </Button>
            </motion.div>
          )
        ) : isCurrent ? (
          <motion.div key="cur" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button disabled variant="outline" className="w-full">
              Your current plan
            </Button>
          </motion.div>
        ) : (
          <motion.div key="up" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button
              onClick={onUpgrade}
              className={cn(
                "w-full gap-1.5",
                isSuggested && `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90`,
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade to {plan.name}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
