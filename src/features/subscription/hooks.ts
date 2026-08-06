/**
 * Subscription hooks — the app-wide gating surface.
 */
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import {
  PLANS,
  planCovers,
  requiredPlanFor,
  requiredPlanForBlock,
  BLOCK_FEATURE_KEY,
  type FeatureKey,
  type PlanCode,
  type PlanDefinition,
} from "./plans";
import type { BlockType } from "@/features/builder/types";
import {
  countBioPages,
  getActivePlanCode,
  getActiveSubscription,
} from "./api";
import { useSubscriptionUI } from "./store";

export function usePlan(): {
  code: PlanCode;
  plan: PlanDefinition;
  isLoading: boolean;
  workspaceId: string | null;
} {
  const { workspace } = useCurrentWorkspace();
  const workspaceId = workspace?.id ?? null;
  const q = useQuery({
    queryKey: ["subscription", "plan", workspaceId],
    queryFn: () => getActivePlanCode(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
  const code: PlanCode = q.data ?? "udaan";
  return { code, plan: PLANS[code], isLoading: q.isLoading, workspaceId };
}

export function useSubscription() {
  const { workspace } = useCurrentWorkspace();
  const workspaceId = workspace?.id ?? null;
  return useQuery({
    queryKey: ["subscription", "row", workspaceId],
    queryFn: () => getActiveSubscription(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export interface FeatureAccess {
  enabled: boolean;
  requiredPlan: PlanCode;
  currentPlan: PlanCode;
  requestUpgrade: () => void;
}

export function useFeature(feature: FeatureKey): FeatureAccess {
  const { code } = usePlan();
  const { openUpgrade, openFeatureDialog, isDismissed } = useSubscriptionUI();
  const requiredPlan = requiredPlanFor(feature);
  const enabled = planCovers(code, requiredPlan);

  const requestUpgrade = useCallback(
    () => {
      // Default benefits and names based on keys
      const defaults: Record<string, { name: string; benefits: string[] }> = {
        "block.store": { 
          name: "Mini Store", 
          benefits: ["Sell digital products & services", "Accept payments via UPI & Razorpay", "Inventory management", "Order tracking"] 
        },
        "block.bookings": { 
          name: "Bookings Pro", 
          benefits: ["Schedule appointments", "Google Calendar sync", "Automated reminders", "Pre-payment for sessions"] 
        },
        "remove_branding": { 
          name: "Remove ZUPIX Branding", 
          benefits: ["100% White-label experience", "Custom footer credit", "Professional brand appearance"] 
        },
        "custom_domain": { 
          name: "Custom Domain", 
          benefits: ["Connect your own domain (e.g. bio.yourname.com)", "Free SSL certificate", "Improved SEO authority"] 
        },
        "block.custom_code": { 
          name: "Advanced Builder & CSS", 
          benefits: ["Inject custom HTML/JS", "Full CSS control", "Third-party widget support"] 
        },
        "block.analytics": { 
          name: "Advanced Analytics", 
          benefits: ["Real-time traffic tracking", "Source & Device breakdown", "Conversion tracking", "Export data"] 
        },
        "block.automation": {
          name: "Automation & Webhooks",
          benefits: ["Connect to Zapier/Make", "Custom Webhooks", "API Access", "Automated Workflows"]
        },
        "advanced_builder": {
          name: "Enterprise Studio Features",
          benefits: ["Advanced Layout Controls", "Version History", "Bulk Duplication", "Premium Presets"]
        }
      };

      const meta = defaults[feature];

      if (isDismissed(feature)) {
        // If dismissed in last 24h, we could still open if it's a direct click, 
        // but often we want to respect the user. However, for a direct "Lock" click, 
        // we should probably always show the intent.
        openFeatureDialog({ 
          feature, 
          suggestedPlan: requiredPlan,
          featureName: meta?.name,
          benefits: meta?.benefits
        });
      } else {
        openFeatureDialog({ 
          feature, 
          suggestedPlan: requiredPlan,
          featureName: meta?.name,
          benefits: meta?.benefits
        });
      }
    },
    [openFeatureDialog, feature, requiredPlan, isDismissed],
  );
  return { enabled, requiredPlan, currentPlan: code, requestUpgrade };
}

export function useBlockAccess(type: BlockType): FeatureAccess {
  const { code } = usePlan();
  const { openFeatureDialog } = useSubscriptionUI();
  const requiredPlan = requiredPlanForBlock(type) ?? "udaan";
  const enabled = planCovers(code, requiredPlan);
  
  const featureKey = BLOCK_FEATURE_KEY[type];

  const requestUpgrade = useCallback(
    () => {
      // Logic handled by useFeature usually, but we keep this for direct block clicks
      openFeatureDialog({ 
        feature: featureKey,
        suggestedPlan: requiredPlan, 
        reason: `The "${type}" block requires ${PLANS[requiredPlan].name} to unlock its full potential.` 
      });
    },
    [openFeatureDialog, requiredPlan, type, featureKey],
  );
  return { enabled, requiredPlan, currentPlan: code, requestUpgrade };
}

export function usePlanLimit(metric: "bio_pages" | "custom_domains"): {
  used: number;
  limit: number;
  isUnlimited: boolean;
  remaining: number;
  exceeded: boolean;
  isLoading: boolean;
} {
  const { plan, workspaceId } = usePlan();
  const planLimit = plan.limits[metric];
  const isUnlimited = planLimit === "unlimited";
  const limit = isUnlimited ? Number.POSITIVE_INFINITY : Number(planLimit);

  const q = useQuery({
    queryKey: ["subscription", "usage", metric, workspaceId],
    queryFn: async () => {
      if (metric === "bio_pages") return countBioPages(workspaceId!);
      // custom_domains — count from domains table when available
      return 0;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
  const used = q.data ?? 0;
  const remaining = isUnlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit - used);
  const exceeded = !isUnlimited && used >= limit;
  return { used, limit, isUnlimited, remaining, exceeded, isLoading: q.isLoading };
}

export function useUpgradeModal() {
  return useSubscriptionUI();
}
