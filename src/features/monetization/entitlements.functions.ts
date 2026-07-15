/**
 * LS-13E — Server functions for tamper-proof entitlement checks and
 * secure billing event recording. All writes go through service role
 * after workspace-admin verification.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const WorkspaceFeatureInput = z.object({
  workspace_id: z.string().uuid(),
  feature_key: z.string().min(1),
});

export const checkWorkspaceFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => WorkspaceFeatureInput.parse(v))
  .handler(async ({ data, context }) => {
    const { data: ok, error } = await context.supabase.rpc("workspace_has_feature", {
      _workspace_id: data.workspace_id,
      _feature_key: data.feature_key,
    });
    if (error) throw new Error(error.message);
    return { enabled: Boolean(ok) };
  });

const LimitInput = z.object({
  workspace_id: z.string().uuid(),
  metric_key: z.string().min(1),
});

export const checkWorkspaceLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => LimitInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: limitRow, error: lErr } = await supabase.rpc("workspace_get_limit", {
      _workspace_id: data.workspace_id,
      _metric_key: data.metric_key,
    });
    if (lErr) throw new Error(lErr.message);
    const first = Array.isArray(limitRow) ? limitRow[0] : limitRow;
    const limit_value = (first?.limit_value ?? 0) as number;
    const is_unlimited = Boolean(first?.is_unlimited);

    const { data: counter, error: cErr } = await supabase
      .from("usage_counters")
      .select("value")
      .eq("workspace_id", data.workspace_id)
      .eq("metric_key", data.metric_key)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    const value = (counter?.value as number | undefined) ?? 0;

    return {
      metric_key: data.metric_key,
      value,
      limit_value,
      is_unlimited,
      remaining: is_unlimited ? Number.POSITIVE_INFINITY : Math.max(0, limit_value - value),
      exceeded: is_unlimited ? false : value >= limit_value,
    };
  });

const IncrementInput = z.object({
  workspace_id: z.string().uuid(),
  metric_key: z.string().min(1),
  delta: z.number().int(),
});

export const incrementUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => IncrementInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMember, error: mErr } = await supabase.rpc("is_workspace_member", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (mErr) throw new Error(mErr.message);
    if (!isMember) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const periodStart = new Date();
    periodStart.setUTCDate(1);
    periodStart.setUTCHours(0, 0, 0, 0);
    const periodEnd = new Date(periodStart);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);

    const { data: existing } = await supabaseAdmin
      .from("usage_counters")
      .select("id, value")
      .eq("workspace_id", data.workspace_id)
      .eq("metric_key", data.metric_key)
      .eq("period_start", periodStart.toISOString())
      .maybeSingle();

    const nextValue = Math.max(0, ((existing?.value as number | undefined) ?? 0) + data.delta);

    if (existing) {
      const { error } = await supabaseAdmin
        .from("usage_counters")
        .update({ value: nextValue, updated_at: new Date().toISOString() } as never)
        .eq("id", existing.id as string);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("usage_counters").insert({
        workspace_id: data.workspace_id,
        metric_key: data.metric_key,
        value: nextValue,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      } as never);
      if (error) throw new Error(error.message);
    }
    return { value: nextValue };
  });

const CreditInput = z.object({
  workspace_id: z.string().uuid(),
  credit_type: z.string().min(1),
  delta: z.number().int(),
  reason: z.string().min(1).max(200),
  reference_type: z.string().optional().nullable(),
  reference_id: z.string().uuid().optional().nullable(),
});

export const recordCredit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CreditInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isMember, error: mErr } = await supabase.rpc("is_workspace_member", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (mErr) throw new Error(mErr.message);
    if (!isMember) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: last } = await supabaseAdmin
      .from("credit_ledger")
      .select("balance_after")
      .eq("workspace_id", data.workspace_id)
      .eq("credit_type", data.credit_type)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const prevBalance = (last?.balance_after as number | undefined) ?? 0;
    const nextBalance = Math.max(0, prevBalance + data.delta);
    if (data.delta < 0 && prevBalance + data.delta < 0) {
      throw new Error("Insufficient credit balance");
    }

    const { error } = await supabaseAdmin.from("credit_ledger").insert({
      workspace_id: data.workspace_id,
      credit_type: data.credit_type,
      delta: data.delta,
      balance_after: nextBalance,
      reason: data.reason,
      reference_type: data.reference_type ?? null,
      reference_id: data.reference_id ?? null,
      actor_id: userId,
    } as never);
    if (error) throw new Error(error.message);
    return { balance: nextBalance };
  });

const BillingEventInput = z.object({
  workspace_id: z.string().uuid(),
  event_type: z.enum([
    "plan_upgrade",
    "plan_downgrade",
    "renewal",
    "cancellation",
    "payment_failure",
    "trial_expiry",
    "trial_extended",
    "addon_purchase",
    "addon_canceled",
  ]),
  subscription_id: z.string().uuid().optional().nullable(),
  invoice_id: z.string().uuid().optional().nullable(),
  from_plan: z.string().optional().nullable(),
  to_plan: z.string().optional().nullable(),
  amount_minor: z.number().int().optional().nullable(),
  currency: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const recordBillingEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => BillingEventInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: aErr } = await supabase.rpc("is_workspace_admin", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (aErr) throw new Error(aErr.message);
    if (!isAdmin) throw new Error("Forbidden: workspace admin required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("billing_events").insert({
      workspace_id: data.workspace_id,
      event_type: data.event_type,
      subscription_id: data.subscription_id ?? null,
      invoice_id: data.invoice_id ?? null,
      actor_id: userId,
      from_plan: data.from_plan ?? null,
      to_plan: data.to_plan ?? null,
      amount_minor: data.amount_minor ?? null,
      currency: data.currency ?? null,
      metadata: data.metadata ?? {},
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PurchaseAddonInput = z.object({
  workspace_id: z.string().uuid(),
  addon_code: z.string().min(1),
  quantity: z.number().int().min(1).max(1000).default(1),
});

export const purchaseAddon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => PurchaseAddonInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: aErr } = await supabase.rpc("is_workspace_admin", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (aErr) throw new Error(aErr.message);
    if (!isAdmin) throw new Error("Forbidden: workspace admin required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: addon, error: addErr } = await supabaseAdmin
      .from("addons")
      .select("*")
      .eq("code", data.addon_code)
      .eq("is_active", true)
      .maybeSingle();
    if (addErr) throw new Error(addErr.message);
    if (!addon) throw new Error("Add-on not found or inactive");

    const now = new Date();
    const ends = new Date(now);
    if (addon.billing_cycle === "yearly") ends.setFullYear(ends.getFullYear() + 1);
    else if (addon.billing_cycle === "lifetime") ends.setFullYear(ends.getFullYear() + 100);
    else ends.setMonth(ends.getMonth() + 1);

    const { error: insErr } = await supabaseAdmin.from("workspace_addons").insert({
      workspace_id: data.workspace_id,
      addon_id: addon.id,
      quantity: data.quantity,
      status: "active",
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
      gateway: "manual",
    } as never);
    if (insErr) throw new Error(insErr.message);

    await supabaseAdmin.from("billing_events").insert({
      workspace_id: data.workspace_id,
      event_type: "addon_purchase",
      actor_id: userId,
      amount_minor: addon.price_minor * data.quantity,
      currency: addon.currency,
      metadata: { addon_code: addon.code, quantity: data.quantity },
    } as never);

    // Grant credits if addon maps to a credit metric
    if (addon.metric_key === "ai_credits" || addon.metric_key === "storage_bytes") {
      const creditType = addon.metric_key === "ai_credits" ? "ai" : "storage";
      const total = addon.quantity_per_unit * data.quantity;
      const { data: last } = await supabaseAdmin
        .from("credit_ledger")
        .select("balance_after")
        .eq("workspace_id", data.workspace_id)
        .eq("credit_type", creditType)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const prev = (last?.balance_after as number | undefined) ?? 0;
      await supabaseAdmin.from("credit_ledger").insert({
        workspace_id: data.workspace_id,
        credit_type: creditType,
        delta: total,
        balance_after: prev + total,
        reason: `Add-on purchase: ${addon.name}`,
        reference_type: "addon",
        reference_id: addon.id,
        actor_id: userId,
      } as never);
    }

    return { ok: true, addon_id: addon.id };
  });
