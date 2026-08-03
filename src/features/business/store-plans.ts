/**
 * Mini Store plan rules.
 *
 * UDAAN  — 3 items, services only.
 * TEJAS  — 25 items, digital products / services / payment links.
 * SHIKHAR— unlimited items, all types.
 *
 * Deliberately no cart, inventory, shipping or checkout logic lives here:
 * Mini Store only sells a handful of items straight from a bio link.
 */
import type { PlanCode } from "@/features/subscription/plans";
import type { StoreItemKind } from "@/features/builder/types";

export function maxStoreItems(plan: PlanCode): number {
  switch (plan) {
    case "udaan":
      return 3;
    case "tejas":
      return 25;
    default:
      return Number.POSITIVE_INFINITY;
  }
}

export function allowedStoreKinds(plan: PlanCode): StoreItemKind[] {
  if (plan === "udaan") return ["service"];
  return ["digital", "service", "payment_link", "buy_now", "whatsapp", "upi_qr", "razorpay"];
}

export function storeKindAllowed(plan: PlanCode, kind: StoreItemKind): boolean {
  return allowedStoreKinds(plan).includes(kind);
}

export function storeLimitLabel(plan: PlanCode): string {
  const max = maxStoreItems(plan);
  const kinds = plan === "udaan" ? "services only" : "all item types";
  return Number.isFinite(max) ? `${max} items · ${kinds}` : `Unlimited items · ${kinds}`;
}
