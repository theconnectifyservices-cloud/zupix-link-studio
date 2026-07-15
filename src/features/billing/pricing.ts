/**
 * LS-13A — Pricing math.
 *
 * All amounts here are integer minor units. Every function returns a
 * fully-broken-down quote so the UI can render subtotal, discount, tax
 * and total without re-computing.
 */
import type { BillingCycle, BillingPlan, Coupon, TaxSettings } from "./types";

export interface PriceQuote {
  currency: string;
  cycle: BillingCycle;
  unit_amount_minor: number;
  subtotal_minor: number;
  discount_minor: number;
  taxable_minor: number;
  tax_minor: number;
  tax_rate: number;
  total_minor: number;
  prices_include_tax: boolean;
  coupon?: { code: string; label: string };
}

export function planPriceForCycle(plan: BillingPlan, cycle: BillingCycle): number | null {
  switch (cycle) {
    case "monthly": return plan.price_monthly_minor;
    case "quarterly": return plan.price_quarterly_minor;
    case "yearly": return plan.price_yearly_minor;
    case "lifetime": return plan.price_lifetime_minor;
  }
}

export interface CouponError { ok: false; reason: string }
export interface CouponApplied { ok: true; discount_minor: number; label: string }

export function applyCoupon(
  coupon: Coupon | null,
  plan: BillingPlan,
  cycle: BillingCycle,
  subtotalMinor: number,
): CouponApplied | CouponError | { ok: true; discount_minor: 0; label: "" } {
  if (!coupon) return { ok: true, discount_minor: 0, label: "" };
  const now = Date.now();
  if (!coupon.is_active) return { ok: false, reason: "Coupon is not active" };
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now)
    return { ok: false, reason: "Coupon not yet valid" };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now)
    return { ok: false, reason: "Coupon expired" };
  if (coupon.max_redemptions !== null && coupon.redeemed_count >= coupon.max_redemptions)
    return { ok: false, reason: "Coupon redemption limit reached" };
  if (coupon.applies_to_plans.length && !coupon.applies_to_plans.includes(plan.code))
    return { ok: false, reason: "Coupon not applicable to this plan" };
  if (coupon.applies_to_cycles.length && !coupon.applies_to_cycles.includes(cycle))
    return { ok: false, reason: "Coupon not applicable to this billing cycle" };

  let discount = 0;
  let label = coupon.name ?? coupon.code;
  if (coupon.kind === "percentage" && coupon.percent_off !== null) {
    discount = Math.round(subtotalMinor * (coupon.percent_off / 100));
    label = `${coupon.percent_off}% off`;
  } else if (coupon.kind === "flat" && coupon.amount_off_minor !== null) {
    discount = coupon.amount_off_minor;
    label = `Flat ${(coupon.amount_off_minor / 100).toFixed(2)} off`;
  }
  discount = Math.min(discount, subtotalMinor);
  return { ok: true, discount_minor: discount, label };
}

export function computeQuote(params: {
  plan: BillingPlan;
  cycle: BillingCycle;
  quantity?: number;
  coupon?: Coupon | null;
  tax?: Pick<TaxSettings, "tax_rate" | "prices_include_tax"> | null;
}): PriceQuote | null {
  const { plan, cycle } = params;
  const qty = Math.max(1, params.quantity ?? 1);
  const unit = planPriceForCycle(plan, cycle);
  if (unit === null) return null;

  const subtotal = unit * qty;
  const coup = applyCoupon(params.coupon ?? null, plan, cycle, subtotal);
  const discount = coup.ok ? coup.discount_minor : 0;
  const rate = params.tax?.tax_rate ?? 0;
  const inclusive = params.tax?.prices_include_tax ?? false;

  let taxable = Math.max(0, subtotal - discount);
  let tax = 0;
  let total = taxable;
  if (rate > 0) {
    if (inclusive) {
      // extract tax from taxable
      const base = Math.round(taxable / (1 + rate / 100));
      tax = taxable - base;
      total = taxable;
      taxable = base;
    } else {
      tax = Math.round(taxable * (rate / 100));
      total = taxable + tax;
    }
  }

  return {
    currency: plan.currency,
    cycle,
    unit_amount_minor: unit,
    subtotal_minor: subtotal,
    discount_minor: discount,
    taxable_minor: taxable,
    tax_minor: tax,
    tax_rate: rate,
    total_minor: total,
    prices_include_tax: inclusive,
    coupon: coup.ok && discount > 0 ? { code: params.coupon!.code, label: coup.label } : undefined,
  };
}

export function formatMoney(minor: number, currency = "INR"): string {
  const value = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}
