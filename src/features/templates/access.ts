/**
 * Template access control — plan × tier gate.
 * Kept dependency-free so the gallery can import it without pulling
 * subscription hooks into non-React consumers.
 */
import type { PlanCode } from "@/features/subscription/plans";
import type { Template, TemplateTier } from "./types";
import { templateTier } from "./types";

/** Smallest plan that can apply themes of this tier. */
export function requiredPlanForTier(tier: TemplateTier): PlanCode {
  switch (tier) {
    case "free":
      return "udaan";
    case "premium":
      return "tejas";
    case "enterprise":
      return "shikhar";
  }
}

const PLAN_RANK: Record<PlanCode, number> = { udaan: 0, tejas: 1, shikhar: 2 };

export function canAccessTemplate(plan: PlanCode, template: Template): boolean {
  const need = requiredPlanForTier(templateTier(template));
  return PLAN_RANK[plan] >= PLAN_RANK[need];
}

export function canAccessTier(plan: PlanCode, tier: TemplateTier): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[requiredPlanForTier(tier)];
}
