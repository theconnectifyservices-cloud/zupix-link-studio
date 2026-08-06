/**
 * Template access control — plan × tier gate.
 * Kept dependency-free so the gallery can import it without pulling
 * subscription hooks into non-React consumers.
 */
import type { PlanCode } from "@/features/subscription/plans";
import { planCovers } from "@/features/subscription/plans";
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
  const tier = templateTier(template);
  if (tier === "free") return true;
  if (tier === "premium") return planCovers(plan, "tejas");
  if (tier === "enterprise") return planCovers(plan, "shikhar");
  return false;
}

export function canAccessTier(plan: PlanCode, tier: TemplateTier): boolean {
  if (tier === "free") return true;
  if (tier === "premium") return planCovers(plan, "tejas");
  if (tier === "enterprise") return planCovers(plan, "shikhar");
  return false;
}

/** 
 * Returns the maximum number of templates allowed for a plan 
 * based on the requirements (UDAAN: 5, TEJAS: 50, SHIKHAR: All).
 */
export function getTemplateLimit(plan: PlanCode): number {
  switch (plan) {
    case "udaan": return 5;
    case "tejas": return 50;
    case "shikhar": return 1000; // Functional "unlimited"
    default: return 5;
  }
}
