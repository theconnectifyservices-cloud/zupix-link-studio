/**
 * Trial engine data access. All reads use the authenticated Supabase
 * client so RLS scopes rows to the caller's workspace.
 */
import { supabase } from "@/integrations/supabase/client";

export type TrialStatus =
  | "trial_active"
  | "trial_ending_soon"
  | "trial_expired"
  | "converted"
  | "cancelled"
  | "none";

export interface TrialInfo {
  subscriptionId: string | null;
  planCode: string;
  status: TrialStatus;
  trialStart: string | null;
  trialEnd: string | null;
  msRemaining: number;
  cancelAtPeriodEnd: boolean;
  isTrialing: boolean;
}

export async function fetchTrialInfo(workspaceId: string): Promise<TrialInfo> {
  const { data: sub } = await supabase
    .from("billing_subscriptions")
    .select("id,status,trial_start,trial_end,cancel_at_period_end,plan_id")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub) {
    return {
      subscriptionId: null,
      planCode: "udaan",
      status: "none",
      trialStart: null,
      trialEnd: null,
      msRemaining: 0,
      cancelAtPeriodEnd: false,
      isTrialing: false,
    };
  }

  const { data: plan } = await supabase
    .from("billing_plans")
    .select("code")
    .eq("id", (sub as { plan_id: string }).plan_id)
    .maybeSingle();

  const trialEnd = (sub as { trial_end: string | null }).trial_end;
  const msRemaining = trialEnd ? new Date(trialEnd).getTime() - Date.now() : 0;
  const statusRaw = (sub as { status: string }).status;
  const isTrialing = statusRaw === "trialing";

  let status: TrialStatus = "none";
  if (statusRaw === "active") status = "converted";
  else if (statusRaw === "canceled") status = "cancelled";
  else if (statusRaw === "expired" || (isTrialing && msRemaining <= 0)) status = "trial_expired";
  else if (isTrialing && msRemaining <= 48 * 3600 * 1000) status = "trial_ending_soon";
  else if (isTrialing) status = "trial_active";

  return {
    subscriptionId: (sub as { id: string }).id,
    planCode: (plan?.code as string | undefined) ?? "udaan",
    status,
    trialStart: (sub as { trial_start: string | null }).trial_start,
    trialEnd,
    msRemaining: Math.max(0, msRemaining),
    cancelAtPeriodEnd: Boolean((sub as { cancel_at_period_end: boolean }).cancel_at_period_end),
    isTrialing,
  };
}

export interface CouponValidation {
  valid: boolean;
  couponId: string | null;
  discountMinor: number;
  reason: string;
}

export async function validateCoupon(
  code: string,
  workspaceId: string,
  planCode: string,
  cycle: string,
  amountMinor: number,
): Promise<CouponValidation> {
  const { data, error } = await supabase.rpc("validate_coupon", {
    _code: code,
    _workspace_id: workspaceId,
    _plan_code: planCode,
    _cycle: cycle,
    _amount_minor: amountMinor,
  } as never);
  if (error) return { valid: false, couponId: null, discountMinor: 0, reason: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { valid: false, couponId: null, discountMinor: 0, reason: "Coupon not found" };
  return {
    valid: Boolean(row.valid),
    couponId: (row.coupon_id as string | null) ?? null,
    discountMinor: Number(row.discount_minor ?? 0),
    reason: String(row.reason ?? ""),
  };
}

export interface CouponRow {
  id: string;
  code: string;
  name: string | null;
  kind: "percentage" | "flat";
  percent_off: number | null;
  amount_off_minor: number | null;
  duration: string;
  applies_to_plans: string[];
  applies_to_cycles: string[];
  max_redemptions: number | null;
  redeemed_count: number;
  minimum_purchase_minor: number | null;
  is_active: boolean;
  archived_at: string | null;
  starts_at: string | null;
  expires_at: string | null;
  category: string | null;
  created_at: string;
}

export async function listCoupons(): Promise<CouponRow[]> {
  const { data, error } = await supabase
    .from("billing_coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CouponRow[];
}

export async function upsertCoupon(row: Partial<CouponRow> & { code: string; kind: "percentage" | "flat" }) {
  const { error } = await supabase.from("billing_coupons").upsert(row as never, { onConflict: "code" });
  if (error) throw error;
}

export async function archiveCoupon(id: string, archived: boolean) {
  const { error } = await supabase
    .from("billing_coupons")
    .update({ archived_at: archived ? new Date().toISOString() : null, is_active: !archived } as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from("billing_coupons").delete().eq("id", id);
  if (error) throw error;
}
