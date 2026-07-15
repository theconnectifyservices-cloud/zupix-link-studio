/**
 * LS-13A — Billing domain types.
 * Money is always stored/transported as integer minor units (paise/cents)
 * to avoid float rounding drift.
 */
export type BillingCycle = "monthly" | "quarterly" | "yearly" | "lifetime";
export type PlanTier = "free" | "starter" | "pro" | "business" | "agency" | "enterprise" | "custom";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "paused"
  | "expired"
  | "incomplete";
export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible" | "refunded";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded";
export type PaymentGateway = "razorpay" | "stripe" | "paypal" | "paddle" | "manual";
export type CouponKind = "percentage" | "flat";
export type CouponDuration = "one_time" | "recurring" | "forever";

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  tier: PlanTier;
  description: string | null;
  features: string[];
  limits: Record<string, number>;
  price_monthly_minor: number | null;
  price_quarterly_minor: number | null;
  price_yearly_minor: number | null;
  price_lifetime_minor: number | null;
  currency: string;
  trial_days: number;
  is_public: boolean;
  is_custom: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface BillingSubscription {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  cycle: BillingCycle;
  currency: string;
  unit_amount_minor: number;
  quantity: number;
  gateway: PaymentGateway | null;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  paused_at: string | null;
  resumed_at: string | null;
  ended_at: string | null;
  coupon_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string | null;
  kind: CouponKind;
  amount_off_minor: number | null;
  percent_off: number | null;
  currency: string | null;
  duration: CouponDuration;
  duration_in_months: number | null;
  applies_to_plans: string[];
  applies_to_cycles: BillingCycle[];
  max_redemptions: number | null;
  redeemed_count: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_amount_minor: number;
  amount_minor: number;
  tax_rate?: number;
  hsn_sac?: string;
}

export interface BillingInvoice {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  invoice_number: string | null;
  status: InvoiceStatus;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  amount_paid_minor: number;
  amount_due_minor: number;
  line_items: InvoiceLineItem[];
  tax_details: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  customer_gstin: string | null;
  seller_gstin: string | null;
  hsn_sac: string | null;
  place_of_supply: string | null;
  issued_at: string | null;
  due_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  gateway: PaymentGateway | null;
  gateway_invoice_id: string | null;
}

export interface BillingPayment {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  invoice_id: string | null;
  gateway: PaymentGateway;
  status: PaymentStatus;
  amount_minor: number;
  currency: string;
  refund_amount_minor: number;
  method: string | null;
  gateway_payment_id: string | null;
  gateway_order_id: string | null;
  failure_reason: string | null;
  captured_at: string | null;
  created_at: string;
}

export interface TaxSettings {
  workspace_id: string;
  tax_type: "GST" | "VAT" | "NONE";
  gstin: string | null;
  legal_name: string | null;
  country: string | null;
  state: string | null;
  tax_rate: number;
  prices_include_tax: boolean;
  billing_address: Record<string, unknown>;
}
