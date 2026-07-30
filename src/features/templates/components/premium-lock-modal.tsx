/**
 * Premium lock modal shown when a Free/Tejas user clicks a theme they
 * cannot yet apply. Provides Upgrade + Compare Plans CTAs.
 */

import { Crown, Lock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TemplateTier } from "../types";
import { PLANS } from "@/features/subscription/plans";
import { useSubscriptionUI } from "@/features/subscription/store";
import { requiredPlanForTier } from "../access";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  templateName?: string;
  tier: TemplateTier;
}

export function PremiumLockModal({ open, onOpenChange, templateName, tier }: Props) {
  const needed = requiredPlanForTier(tier);
  const plan = PLANS[needed];
  const openUpgrade = useSubscriptionUI((s) => s.openUpgrade);

  const isEnterprise = tier === "enterprise";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] max-w-md gap-0 touch-pan-y overflow-y-auto overscroll-contain p-0 sm:max-h-[90dvh]">
        {/* Animated hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-purple-500/10 to-amber-500/10 px-6 pb-6 pt-8 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-primary-foreground shadow-lg">
              {isEnterprise ? <Crown className="h-7 w-7" /> : <Lock className="h-7 w-7" />}
            </div>
          </div>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            {templateName ? `"${templateName}"` : "This theme"} is available in the {plan.name} Plan
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEnterprise
              ? "White-label and enterprise-only themes ship with Shikhar."
              : "Unlock 50+ premium themes, custom domain and remove ZUPIX branding."}
          </p>
        </div>

        <div className="space-y-2 border-t bg-background px-6 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">What you unlock</span>
          </div>
          <ul className="grid gap-1 pl-6 text-sm text-muted-foreground">
            {plan.highlights.slice(0, 4).map((h) => (
              <li key={h} className="list-disc">
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2 border-t bg-muted/30 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              openUpgrade({ suggestedPlan: needed, reason: `Unlock the "${templateName}" theme.` });
            }}
          >
            Upgrade to {plan.name}
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              Compare Plans
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
