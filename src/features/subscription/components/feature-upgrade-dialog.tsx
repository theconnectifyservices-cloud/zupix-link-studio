import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, CheckCircle2, ArrowRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSubscriptionUI } from "../store";
import { PLANS, type PlanCode } from "../plans";
import { cn } from "@/lib/utils";

/**
 * Enterprise Feature Access Flow Dialog.
 * Instead of jumping straight to pricing, explains the value of the locked feature.
 */
export function FeatureUpgradeDialog() {
  const { 
    featureDialogOpen, 
    upgradeContext, 
    closeFeatureDialog, 
    openUpgrade,
    dismissFeature 
  } = useSubscriptionUI();

  const { 
    feature, 
    featureName, 
    suggestedPlan = "tejas", 
    benefits = [], 
    reason 
  } = upgradeContext;

  const plan = PLANS[suggestedPlan];
  const displayTitle = featureName || (feature ? feature.replace("block.", "").replace("_", " ") : "Premium Feature");

  const handleUpgrade = () => {
    openUpgrade(upgradeContext);
  };

  const handleMaybeLater = () => {
    if (feature) {
      dismissFeature(feature);
    } else {
      closeFeatureDialog();
    }
  };

  const handleCompare = () => {
    openUpgrade({ ...upgradeContext, reason: "Compare all our premium plans" });
  };

  return (
    <Dialog open={featureDialogOpen} onOpenChange={(o) => !o && closeFeatureDialog()}>
      <DialogContent className="max-w-xl border-none bg-transparent p-0 shadow-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border bg-background/95 backdrop-blur-xl"
        >
          {/* Decorative backgrounds */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className={cn("absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl opacity-20 bg-gradient-to-br", plan.gradient)} />
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          </div>

          <div className="relative p-8 sm:p-10">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className={cn("mb-6 flex h-20 w-20 items-center justify-center rounded-2xl shadow-xl bg-gradient-to-br text-white", plan.gradient)}>
                <Lock className="h-10 w-10" />
              </div>
              
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                {plan.name} Plan Exclusive
              </div>
              
              <h2 className="text-3xl font-bold tracking-tight capitalize">
                {displayTitle}
              </h2>
              
              <p className="mt-4 text-muted-foreground max-w-sm">
                {reason || `Unlock the full potential of your Bio Link with the ${plan.name} plan.`}
              </p>
            </div>

            {/* Benefits list */}
            {benefits.length > 0 && (
              <div className="mt-8 space-y-3 rounded-2xl border bg-card/50 p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">What's included:</p>
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-10 flex flex-col gap-3">
              <Button 
                size="lg" 
                className={cn("h-14 text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20", plan.gradient, "text-white border-none")}
                onClick={handleUpgrade}
              >
                Upgrade Now to {plan.name}
                <ArrowRight className="h-5 w-5" />
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 font-semibold" onClick={handleCompare}>
                  Compare Plans
                </Button>
                <Button variant="ghost" className="h-12 font-semibold text-muted-foreground" onClick={handleMaybeLater}>
                  Maybe Later
                </Button>
              </div>
            </div>

            <p className="mt-6 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Join 10,000+ creators growing with ZUPIX
            </p>
          </div>
          
          <button 
            onClick={closeFeatureDialog}
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
