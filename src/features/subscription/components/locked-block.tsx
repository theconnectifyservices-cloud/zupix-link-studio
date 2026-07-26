import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanCode } from "../plans";
import { PlanBadge } from "./plan-badge";
import { useSubscriptionUI } from "../store";

interface Props {
  requiredPlan: PlanCode;
  blockLabel: string;
  description?: string;
}

/** Rendered in place of a locked block on the canvas. */
export function LockedBlock({ requiredPlan, blockLabel, description }: Props) {
  const plan = PLANS[requiredPlan];
  const openUpgrade = useSubscriptionUI((s) => s.openUpgrade);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-5"
    >
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.25),transparent_50%)]" />
      <div className="relative flex items-start gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${plan.gradient} text-white shadow-lg`}>
          <Lock className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{blockLabel}</div>
            <PlanBadge plan={requiredPlan} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {description ?? `Unlock this block with ${plan.emoji} ${plan.name}. ${plan.tagline}`}
          </p>
          <Button
            size="sm"
            className="mt-3 gap-1.5"
            onClick={() => openUpgrade({ suggestedPlan: requiredPlan })}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to {plan.name}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
