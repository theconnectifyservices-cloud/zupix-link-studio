/**
 * LS-13E — Monetization data access (client-side, RLS-scoped).
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  Addon,
  BillingEvent,
  CreditLedgerEntry,
  PlanFeature,
  PlanLimit,
  UsageCounter,
  WorkspaceAddon,
} from "./types";

export async function listAddons(): Promise<Addon[]> {
  const { data, error } = await supabase
    .from("addons")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Addon[];
}

export async function listPlanFeatures(): Promise<PlanFeature[]> {
  const { data, error } = await supabase.from("plan_features").select("*");
  if (error) throw error;
  return (data ?? []) as unknown as PlanFeature[];
}

export async function listPlanLimits(): Promise<PlanLimit[]> {
  const { data, error } = await supabase.from("plan_limits").select("*");
  if (error) throw error;
  return (data ?? []) as unknown as PlanLimit[];
}

export async function listWorkspaceAddons(workspaceId: string): Promise<WorkspaceAddon[]> {
  const { data, error } = await supabase
    .from("workspace_addons")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as WorkspaceAddon[];
}

export async function listUsageCounters(workspaceId: string): Promise<UsageCounter[]> {
  const { data, error } = await supabase
    .from("usage_counters")
    .select("*")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  return (data ?? []) as unknown as UsageCounter[];
}

export async function listCreditHistory(
  workspaceId: string,
  creditType?: string,
  limit = 50,
): Promise<CreditLedgerEntry[]> {
  let q = supabase
    .from("credit_ledger")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (creditType) q = q.eq("credit_type", creditType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as CreditLedgerEntry[];
}

export async function getCreditBalance(
  workspaceId: string,
  creditType: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("credit_ledger")
    .select("balance_after")
    .eq("workspace_id", workspaceId)
    .eq("credit_type", creditType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.balance_after as number | undefined) ?? 0;
}

export async function listBillingEvents(
  workspaceId: string,
  limit = 50,
): Promise<BillingEvent[]> {
  const { data, error } = await supabase
    .from("billing_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as BillingEvent[];
}

/** Check a feature entitlement using the server-side helper (cached per call). */
export async function checkFeature(
  workspaceId: string,
  featureKey: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("workspace_has_feature", {
    _workspace_id: workspaceId,
    _feature_key: featureKey,
  });
  if (error) throw error;
  return Boolean(data);
}
