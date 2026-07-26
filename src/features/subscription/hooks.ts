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
  const openUpgrade = useSubscriptionUI((s) => s.openUpgrade);
  const requiredPlan = requiredPlanFor(feature);
  const enabled = planCovers(code, requiredPlan);
  const requestUpgrade = useCallback(
    () => openUpgrade({ feature, suggestedPlan: requiredPlan }),
    [openUpgrade, feature, requiredPlan],
  );
  return { enabled, requiredPlan, currentPlan: code, requestUpgrade };
}

export function useBlockAccess(type: BlockType): FeatureAccess {
  const { code } = usePlan();
  const openUpgrade = useSubscriptionUI((s) => s.openUpgrade);
  const requiredPlan = requiredPlanForBlock(type) ?? "udaan";
  const enabled = planCovers(code, requiredPlan);
  const requestUpgrade = useCallback(
    () => openUpgrade({ suggestedPlan: requiredPlan, reason: `The "${type}" block requires ${PLANS[requiredPlan].name}.` }),
    [openUpgrade, requiredPlan, type],
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
