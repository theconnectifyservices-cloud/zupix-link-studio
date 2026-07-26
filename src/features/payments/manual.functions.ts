/**
 * Super-admin operations: manual subscription grants and offline payment entry.
 * Both produce a `payment_orders` row (status=paid) then invoke the shared
 * lifecycle activator so subscription, invoice, receipt and audit trail are
 * generated the same way as a real gateway payment.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";
type OfflineMode = "cash" | "upi" | "bank" | "cheque";

async function assertSuperOrAdmin(context: { supabase: any; userId: string }) {
  const [{ data: s }, { data: a }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (!s && !a) throw new Error("Admin role required");
}

/** Type-ahead search: workspaces by name/slug (super admin). */
export const searchWorkspacesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { query: string }) => d)
  .handler(async ({ data, context }) => {
    await assertSuperOrAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const term = data.query.trim();
    const q = supabaseAdmin
      .from("workspaces")
      .select("id, name, slug, owner_id")
      .order("created_at", { ascending: false })
      .limit(20);
    const { data: rows, error } = term
      ? await q.or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
      : await q;
    if (error) throw error;
    return rows ?? [];
  });

/** List active billing plans for the picker. */
export const listPlansAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperOrAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("billing_plans")
      .select("id, code, name, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
      .eq("is_active", true)
      .order("price_monthly_minor", { ascending: true, nullsFirst: true });
    if (error) throw error;
    return data ?? [];
  });

async function priceFor(planId: string, cycle: Cycle) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("billing_plans")
    .select("currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
    .eq("id", planId)
    .single();
  if (error || !data) throw new Error("Plan not found");
  const minor =
    cycle === "monthly" ? data.price_monthly_minor :
    cycle === "quarterly" ? data.price_quarterly_minor :
    cycle === "yearly" ? data.price_yearly_minor :
    data.price_lifetime_minor;
  return { amount: Number(minor ?? 0), currency: data.currency ?? "INR" };
}

/**
 * Grant a subscription with zero payment collected. Records a paid,
 * zero-amount invoice tagged `manual_grant` for a clean audit trail.
 */
export const grantManualSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      planId: string;
      cycle: Cycle;
      reason: string;
      note?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertSuperOrAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workspaces").select("owner_id").eq("id", data.workspaceId).single();
    if (wsErr || !ws) throw new Error("Workspace not found");

    const idem = `manual-grant-${data.workspaceId}-${Date.now()}`;
    const { data: order, error: oErr } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        workspace_id: data.workspaceId,
        user_id: ws.owner_id,
        plan_id: data.planId,
        provider: "manual_upi",
        amount_paise: 0,
        currency: "INR",
        status: "paid",
        idempotency_key: idem,
        meta: {
          cycle: data.cycle,
          manual_grant: true,
          reason: data.reason,
          note: data.note ?? null,
          granted_by: context.userId,
        },
      } as never)
      .select("id")
      .single();
    if (oErr || !order) throw new Error(`Order create failed: ${oErr?.message}`);

    const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
    const result = await activateFromPaidOrder({
      orderId: order.id,
      gatewayPaymentId: `manual-${order.id.slice(0, 8)}`,
      method: "manual_grant",
      actorUserId: context.userId,
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      workspace_id: data.workspaceId,
      action: "billing.manual_grant",
      target_type: "subscription",
      target_id: result.subscriptionId,
      metadata: { plan_id: data.planId, cycle: data.cycle, reason: data.reason, note: data.note ?? null },
    } as never).select().maybeSingle().then(() => null).catch(() => null);

    return result;
  });

/** Record an offline payment (cash / bank transfer / cheque / offline UPI). */
export const recordOfflinePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      planId: string;
      cycle: Cycle;
      mode: OfflineMode;
      amountRupees: number;
      referenceNo?: string;
      screenshotUrl?: string;
      notes?: string;
    }) => d,
  )
  .handler(async ({ data, context }) => {
    await assertSuperOrAdmin(context);
    if (data.amountRupees <= 0) throw new Error("Amount must be positive");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: ws, error: wsErr } = await supabaseAdmin
      .from("workspaces").select("owner_id").eq("id", data.workspaceId).single();
    if (wsErr || !ws) throw new Error("Workspace not found");

    const idem = `offline-${data.workspaceId}-${Date.now()}`;
    const { data: order, error: oErr } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        workspace_id: data.workspaceId,
        user_id: ws.owner_id,
        plan_id: data.planId,
        provider: "manual_upi",
        amount_paise: Math.round(data.amountRupees * 100),
        currency: "INR",
        status: "paid",
        idempotency_key: idem,
        meta: {
          cycle: data.cycle,
          offline: true,
          mode: data.mode,
          reference_no: data.referenceNo ?? null,
          screenshot_url: data.screenshotUrl ?? null,
          notes: data.notes ?? null,
          recorded_by: context.userId,
        },
      } as never)
      .select("id")
      .single();
    if (oErr || !order) throw new Error(`Order create failed: ${oErr?.message}`);

    const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
    const result = await activateFromPaidOrder({
      orderId: order.id,
      gatewayPaymentId: data.referenceNo ?? `offline-${order.id.slice(0, 8)}`,
      method: data.mode,
      actorUserId: context.userId,
    });

    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      workspace_id: data.workspaceId,
      action: "billing.offline_payment",
      target_type: "invoice",
      target_id: result.invoiceId,
      metadata: {
        mode: data.mode,
        amount_rupees: data.amountRupees,
        reference_no: data.referenceNo ?? null,
      },
    } as never).select().maybeSingle().then(() => null).catch(() => null);

    return result;
  });
