import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionUI } from "@/features/subscription/store";
import { trackGrowthEvent } from "../track";

const FEATURES = [
  "Remove ZUPIX Branding",
  "Custom Domain",
  "Forms",
  "File Downloads",
  "Custom Code",
  "Premium Components",
  "Advanced Analytics",
];

/**
 * Dashboard-side upsell card, shown to Starter workspaces.
 * Consumed inside the authenticated app (dashboard, builder sidebar, etc.).
 */
export function UpgradeCard({ className }: { className?: string }) {
  const openUpgrade = useSubscriptionUI((s) => s.openUpgrade);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-primary/8 via-background to-purple-500/8 p-5 shadow-sm dark:border-white/10 ${className ?? ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 80% at 100% 0%, hsl(var(--primary)/0.18), transparent 55%), radial-gradient(120% 80% at 0% 100%, rgba(236,72,153,0.12), transparent 55%)",
        }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-purple-600 text-white shadow">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-semibold">Upgrade to Premium</div>
            <div className="text-[11px] text-muted-foreground">Unlock the full ZUPIX toolkit</div>
          </div>
        </div>
        <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-[12px] text-foreground/90">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          size="sm"
          className="w-fit gap-1.5"
          onClick={() => {
            trackGrowthEvent("upgrade_click", { source: "upgrade_card" });
            openUpgrade({ suggestedPlan: "tejas" });
          }}
        >
          Upgrade Now
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
