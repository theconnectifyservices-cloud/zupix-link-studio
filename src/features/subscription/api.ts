/**
 * Subscription data access. Reads DB-backed plans/features/limits with
 * RLS-scoped Supabase client. Falls back to the static PLANS registry
 * when the DB is unreachable during dev.
 */
import { supabase } from "@/integrations/supabase/client";
import type { PlanCode } from "./plans";
import { PLANS } from "./plans";

export interface DbPlan {
  id: string;
  code: string;
  name: string;
  tier: string;
  description: string | null;
  price_monthly_minor: number | null;
  price_yearly_minor: number | null;
  currency: string;
  is_public: boolean;
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown> | null;
}

export interface DbSubscription {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: string;
  cycle: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export async function listPlans(): Promise<DbPlan[]> {
  const { data, error } = await supabase
    .from("billing_plans")
    .select("id, code, name, tier, description, price_monthly_minor, price_yearly_minor, currency, is_public, is_active, sort_order, metadata")
    .in("code", ["udaan", "tejas", "shikhar"])
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as DbPlan[];
}

export async function getActiveSubscription(workspaceId: string): Promise<DbSubscription | null> {
  const { data, error } = await supabase
    .from("billing_subscriptions")
    .select("id, workspace_id, plan_id, status, cycle, current_period_end, cancel_at_period_end")
    .eq("workspace_id", workspaceId)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as DbSubscription | null) ?? null;
}

export async function workspaceHasFeature(workspaceId: string, featureKey: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("workspace_has_feature", {
    _workspace_id: workspaceId,
    _feature_key: featureKey,
  } as never);
  if (error) return false;
  return Boolean(data);
}

export async function workspaceGetLimit(
  workspaceId: string,
  metricKey: string,
): Promise<{ limit_value: number; is_unlimited: boolean } | null> {
  const { data, error } = await supabase.rpc("workspace_get_limit", {
    _workspace_id: workspaceId,
    _metric_key: metricKey,
  } as never);
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { limit_value: Number(row.limit_value), is_unlimited: Boolean(row.is_unlimited) };
}

/** Resolve a workspace's active plan code, defaulting to `udaan`. */
export async function getActivePlanCode(workspaceId: string): Promise<PlanCode> {
  const sub = await getActiveSubscription(workspaceId);
  if (!sub) return "udaan";
  const { data } = await supabase
    .from("billing_plans")
    .select("code")
    .eq("id", sub.plan_id)
    .maybeSingle();
  const code = (data?.code as string | undefined) ?? "udaan";
  return (code in PLANS ? code : "udaan") as PlanCode;
}

/** Count of bio pages the workspace has created (soft-deleted excluded). */
export async function countBioPages(workspaceId: string): Promise<number> {
  const { count, error } = await supabase
    .from("bio_pages")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);
  if (error) return 0;
  return count ?? 0;
}
