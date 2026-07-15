/**
 * LS-13A — Billing data access (client-side, RLS-scoped).
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  BillingInvoice,
  BillingPayment,
  BillingPlan,
  BillingSubscription,
  Coupon,
  TaxSettings,
} from "./types";

export async function listPublicPlans(): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("*")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as BillingPlan[];
}

export async function getWorkspaceSubscription(workspaceId: string): Promise<BillingSubscription | null> {
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as BillingSubscription | null) ?? null;
}

export async function listInvoices(workspaceId: string, limit = 50): Promise<BillingInvoice[]> {
  const { data, error } = await supabase
    .from("billing_invoices")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as BillingInvoice[];
}

export async function listPayments(workspaceId: string, limit = 50): Promise<BillingPayment[]> {
  const { data, error } = await supabase
    .from("billing_payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as BillingPayment[];
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from("billing_coupons")
    .select("*")
    .eq("code", code.trim())
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Coupon | null) ?? null;
}

export async function getTaxSettings(workspaceId: string): Promise<TaxSettings | null> {
  const { data, error } = await supabase
    .from("billing_tax_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as TaxSettings | null) ?? null;
}

export async function upsertTaxSettings(
  workspaceId: string,
  patch: Partial<Omit<TaxSettings, "workspace_id">>,
): Promise<TaxSettings> {
  const row: Record<string, unknown> = { workspace_id: workspaceId, ...patch };
  const { data, error } = await supabase
    .from("billing_tax_settings")
    .upsert(row as never, { onConflict: "workspace_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as TaxSettings;
}

/** Create/refresh a subscription row locally (gateway sync happens via webhook). */
export async function upsertLocalSubscription(
  workspaceId: string,
  patch: Partial<BillingSubscription> & { plan_id: string; cycle: BillingSubscription["cycle"] },
): Promise<BillingSubscription> {
  const row: Record<string, unknown> = { workspace_id: workspaceId, ...patch };
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .upsert(row as never, { onConflict: "workspace_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as BillingSubscription;
}

/** Transition helpers — admin RLS gates writes. */
export async function cancelSubscription(id: string, atPeriodEnd = true): Promise<void> {
  const patch: Record<string, unknown> = atPeriodEnd
    ? { cancel_at_period_end: true }
    : { status: "canceled", canceled_at: new Date().toISOString(), ended_at: new Date().toISOString() };
  const { error } = await supabase.from("billing_subscriptions").update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function pauseSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from("billing_subscriptions")
    .update({ status: "paused", paused_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function resumeSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from("billing_subscriptions")
    .update({
      status: "active",
      paused_at: null,
      resumed_at: new Date().toISOString(),
    } as never)
    .eq("id", id);
  if (error) throw error;
}
