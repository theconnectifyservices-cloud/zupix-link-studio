import { supabase } from "@/integrations/supabase/client";
import type {
  Commission,
  CommissionRule,
  MarketplaceAsset,
  MarketplaceCategory,
  MarketplaceKind,
  MarketplaceStatus,
  PartnerInvoice,
  PartnerPayment,
  PartnerSubscription,
  Payout,
  PayoutStatus,
  Promotion,
  PromotionStatus,
} from "./types";

const SUBS = "partner_subscriptions" as never;
const INV = "partner_invoices" as never;
const PAY = "partner_payments" as never;
const CRULE = "commission_rules" as never;
const COMM = "commissions" as never;
const POUT = "payouts" as never;
const MCAT = "marketplace_categories" as never;
const MASSET = "marketplace_assets" as never;
const PROMO = "partner_promotions" as never;
const PAA = "partner_admin_actions" as never;

async function rows<T>(p: PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const { data, error } = await p;
  if (error) throw error;
  return ((data as unknown) as T[]) ?? [];
}

// ============ Subscriptions ============
export async function listSubscriptions(tenantId: string): Promise<PartnerSubscription[]> {
  return rows<PartnerSubscription>(
    supabase.from(SUBS).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
  );
}
export async function upsertSubscription(row: Partial<PartnerSubscription> & { tenant_id: string; plan_key: string }): Promise<void> {
  const { error } = await supabase.from(SUBS).insert(row as never);
  if (error) throw error;
}

// ============ Invoices ============
export async function listInvoices(tenantId: string): Promise<PartnerInvoice[]> {
  return rows<PartnerInvoice>(
    supabase.from(INV).select("*").eq("tenant_id", tenantId).order("issued_at", { ascending: false }),
  );
}
export async function createInvoice(row: Partial<PartnerInvoice> & { tenant_id: string; number: string; amount_cents: number }): Promise<void> {
  const { error } = await supabase.from(INV).insert(row as never);
  if (error) throw error;
}
export async function markInvoicePaid(id: string): Promise<void> {
  const { error } = await supabase
    .from(INV)
    .update({ status: "paid", paid_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

// ============ Payments ============
export async function listPayments(tenantId: string): Promise<PartnerPayment[]> {
  return rows<PartnerPayment>(
    supabase.from(PAY).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
  );
}

// ============ Commission Rules ============
export async function listCommissionRules(tenantId: string): Promise<CommissionRule[]> {
  return rows<CommissionRule>(
    supabase.from(CRULE).select("*").eq("tenant_id", tenantId).order("priority", { ascending: true }),
  );
}
export async function upsertCommissionRule(row: Partial<CommissionRule> & { tenant_id: string; name: string }): Promise<void> {
  if (row.id) {
    const { error } = await supabase.from(CRULE).update(row as never).eq("id", row.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(CRULE).insert(row as never);
  if (error) throw error;
}
export async function deleteCommissionRule(id: string): Promise<void> {
  const { error } = await supabase.from(CRULE).delete().eq("id", id);
  if (error) throw error;
}

// ============ Commissions ============
export async function listCommissions(tenantId: string, status?: string): Promise<Commission[]> {
  let q = supabase.from(COMM).select("*").eq("tenant_id", tenantId).order("earned_at", { ascending: false }).limit(500);
  if (status && status !== "all") q = q.eq("status", status);
  return rows<Commission>(q);
}
export async function setCommissionStatus(id: string, status: "pending" | "approved" | "paid" | "void"): Promise<void> {
  const { error } = await supabase.from(COMM).update({ status } as never).eq("id", id);
  if (error) throw error;
}

// ============ Payouts ============
export async function listPayouts(tenantId: string): Promise<Payout[]> {
  return rows<Payout>(
    supabase.from(POUT).select("*").eq("tenant_id", tenantId).order("requested_at", { ascending: false }),
  );
}
export async function createPayout(row: { tenant_id: string; amount_cents: number; method?: string; notes?: string }): Promise<Payout> {
  const { data, error } = await supabase.from(POUT).insert(row as never).select("*").single();
  if (error) throw error;
  return data as unknown as Payout;
}
export async function setPayoutStatus(id: string, status: PayoutStatus, patch?: Partial<Payout>): Promise<void> {
  const body: Record<string, unknown> = { status, ...(patch ?? {}) };
  if (status === "paid") body.paid_at = new Date().toISOString();
  if (status === "processing") body.processed_at = new Date().toISOString();
  const { error } = await supabase.from(POUT).update(body as never).eq("id", id);
  if (error) throw error;
}

// ============ Marketplace ============
export async function listCategories(kind?: MarketplaceKind): Promise<MarketplaceCategory[]> {
  let q = supabase.from(MCAT).select("*").order("kind").order("sort_order");
  if (kind) q = q.eq("kind", kind);
  return rows<MarketplaceCategory>(q);
}
export async function listAssets(tenantId: string, status?: MarketplaceStatus | "all", kind?: MarketplaceKind | "all"): Promise<MarketplaceAsset[]> {
  let q = supabase.from(MASSET).select("*").eq("tenant_id", tenantId).order("updated_at", { ascending: false });
  if (status && status !== "all") q = q.eq("status", status);
  if (kind && kind !== "all") q = q.eq("kind", kind);
  return rows<MarketplaceAsset>(q);
}
export async function upsertAsset(row: Partial<MarketplaceAsset> & { tenant_id: string; kind: MarketplaceKind; title: string; slug: string }): Promise<void> {
  if (row.id) {
    const { error } = await supabase.from(MASSET).update(row as never).eq("id", row.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(MASSET).insert(row as never);
  if (error) throw error;
}
export async function setAssetStatus(id: string, status: MarketplaceStatus): Promise<void> {
  const body: Record<string, unknown> = { status };
  if (status === "published") body.published_at = new Date().toISOString();
  const { error } = await supabase.from(MASSET).update(body as never).eq("id", id);
  if (error) throw error;
}
export async function setAssetFeatured(id: string, featured: boolean): Promise<void> {
  const { error } = await supabase.from(MASSET).update({ featured } as never).eq("id", id);
  if (error) throw error;
}
export async function deleteAsset(id: string): Promise<void> {
  const { error } = await supabase.from(MASSET).delete().eq("id", id);
  if (error) throw error;
}

// ============ Promotions ============
export async function listPromotions(tenantId: string): Promise<Promotion[]> {
  return rows<Promotion>(
    supabase.from(PROMO).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }),
  );
}
export async function upsertPromotion(row: Partial<Promotion> & { tenant_id: string; code: string; name: string }): Promise<void> {
  if (row.id) {
    const { error } = await supabase.from(PROMO).update(row as never).eq("id", row.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(PROMO).insert(row as never);
  if (error) throw error;
}
export async function setPromotionStatus(id: string, status: PromotionStatus): Promise<void> {
  const { error } = await supabase.from(PROMO).update({ status } as never).eq("id", id);
  if (error) throw error;
}

// ============ Admin Audit ============
export async function logAdminAction(row: { actor_id: string; tenant_id: string | null; action: string; meta?: Record<string, unknown> }): Promise<void> {
  const { error } = await supabase.from(PAA).insert({ meta: {}, ...row } as never);
  if (error) throw error;
}
export async function listAdminActions(tenantId: string): Promise<import("./types").AdminAction[]> {
  return rows(
    supabase.from(PAA).select("*").eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(200),
  );
}

// ============ Commission compute ============
export function computeCommission(baseAmountCents: number, rule: CommissionRule): number {
  switch (rule.rule_type) {
    case "fixed":
      return Math.round(rule.value * 100);
    case "percentage":
      return Math.round((baseAmountCents * rule.value) / 100);
    case "tiered": {
      const tiers = rule.config.tiers ?? [];
      const applicable = [...tiers].sort((a, b) => b.min - a.min).find((t) => baseAmountCents >= t.min);
      return applicable ? Math.round((baseAmountCents * applicable.rate) / 100) : 0;
    }
    case "custom":
    default:
      return Math.round((baseAmountCents * rule.value) / 100);
  }
}
