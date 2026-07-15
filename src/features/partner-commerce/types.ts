export type PartnerStatus = "pending" | "approved" | "suspended" | "rejected";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled" | "expired";
export type InvoiceStatus = "draft" | "open" | "paid" | "overdue" | "void" | "refunded";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";
export type CommissionRuleType = "fixed" | "percentage" | "tiered" | "custom";
export type CommissionStatus = "pending" | "approved" | "paid" | "void";
export type PayoutStatus = "pending" | "processing" | "paid" | "failed" | "cancelled";
export type MarketplaceKind =
  | "template"
  | "theme"
  | "component"
  | "prompt_pack"
  | "brand_kit"
  | "plugin";
export type MarketplaceStatus = "draft" | "published" | "unpublished" | "archived";
export type PromotionDiscountType = "percentage" | "fixed";
export type PromotionStatus = "scheduled" | "active" | "expired" | "disabled";

export interface PartnerSubscription {
  id: string;
  tenant_id: string;
  plan_key: string;
  status: SubscriptionStatus;
  price_cents: number;
  currency: string;
  billing_interval: string;
  started_at: string;
  renewal_at: string | null;
  cancelled_at: string | null;
  outstanding_cents: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PartnerInvoice {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  number: string;
  amount_cents: number;
  tax_cents: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  line_items: Array<{ description: string; amount_cents: number; quantity?: number }>;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PartnerPayment {
  id: string;
  tenant_id: string;
  invoice_id: string | null;
  amount_cents: number;
  currency: string;
  method: string | null;
  status: PaymentStatus;
  reference: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CommissionRule {
  id: string;
  tenant_id: string;
  name: string;
  rule_type: CommissionRuleType;
  value: number;
  config: { tiers?: Array<{ min: number; rate: number }>; notes?: string };
  client_id: string | null;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Commission {
  id: string;
  tenant_id: string;
  client_id: string | null;
  rule_id: string | null;
  invoice_ref: string | null;
  base_amount_cents: number;
  commission_cents: number;
  currency: string;
  status: CommissionStatus;
  earned_at: string;
  payout_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  tenant_id: string;
  amount_cents: number;
  currency: string;
  status: PayoutStatus;
  method: string | null;
  reference: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCategory {
  id: string;
  kind: MarketplaceKind;
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceAsset {
  id: string;
  tenant_id: string;
  kind: MarketplaceKind;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  category_key: string | null;
  status: MarketplaceStatus;
  featured: boolean;
  version: string;
  thumbnail_url: string | null;
  preview_url: string | null;
  asset: Record<string, unknown>;
  tags: string[];
  downloads: number;
  rating: number;
  review_count: number;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: PromotionDiscountType;
  discount_value: number;
  applies_to: Record<string, unknown>;
  starts_at: string | null;
  ends_at: string | null;
  max_redemptions: number | null;
  redemptions: number;
  status: PromotionStatus;
  campaign_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminAction {
  id: string;
  actor_id: string | null;
  tenant_id: string | null;
  action: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export const MARKETPLACE_KINDS: MarketplaceKind[] = [
  "template",
  "theme",
  "component",
  "prompt_pack",
  "brand_kit",
  "plugin",
];

export const MARKETPLACE_STATUSES: MarketplaceStatus[] = [
  "draft",
  "published",
  "unpublished",
  "archived",
];

export const COMMISSION_RULE_TYPES: CommissionRuleType[] = [
  "fixed",
  "percentage",
  "tiered",
  "custom",
];
