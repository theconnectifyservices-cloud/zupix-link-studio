/**
 * Enterprise subscription lifecycle orchestrator.
 *
 * Single source of truth used by webhook routes, manual-UPI approval, and
 * admin actions to activate a subscription from a paid `payment_orders`
 * row. Idempotent: safe to retry.
 *
 * SERVER-ONLY — never import from client code.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";
type PaymentGatewayEnum = "razorpay" | "payu" | "cashfree" | "manual_upi" | "manual" | "stripe" | "paypal" | "paddle";
type PaymentProviderEnum = "razorpay" | "payu" | "cashfree" | "manual_upi";

export interface LifecycleResult {
  ok: boolean;
  subscriptionId: string;
  invoiceId: string;
  paymentId: string;
  duplicate?: boolean;
  action: "activated" | "renewed" | "upgraded" | "downgraded";
}

function periodEnd(cycle: Cycle, from = new Date()): Date | null {
  const d = new Date(from);
  switch (cycle) {
    case "monthly": d.setMonth(d.getMonth() + 1); return d;
    case "quarterly": d.setMonth(d.getMonth() + 3); return d;
    case "yearly": d.setFullYear(d.getFullYear() + 1); return d;
    case "lifetime": return null;
    default: return null;
  }
}

function planRank(code: string | null | undefined): number {
  const order = ["udaan", "free", "starter", "tejas", "pro", "business", "shikhar", "agency", "enterprise"];
  const idx = code ? order.indexOf(code) : -1;
  return idx < 0 ? 0 : idx;
}

/**
 * Activate a subscription from a paid payment_orders row. Idempotent.
 *
 * Steps: locate order → derive plan/cycle → upsert subscription → create/
 * mark invoice paid → insert billing_payments (unique on gateway+payment_id)
 * → emit billing_event → notify workspace owner.
 */
export async function activateFromPaidOrder(input: {
  orderId: string;
  gatewayPaymentId?: string | null;
  gatewaySignature?: string | null;
  method?: string | null;
  actorUserId?: string | null;
}): Promise<LifecycleResult> {
  const { data: order, error: oErr } = await supabaseAdmin
    .from("payment_orders")
    .select("*")
    .eq("id", input.orderId)
    .single();
  if (oErr || !order) throw new Error(`Order not found: ${input.orderId}`);

  const workspaceId = order.workspace_id as string;
  const planId = order.plan_id as string | null;
  if (!planId) throw new Error("Order has no plan_id");

  const meta = (order.meta as Record<string, unknown> | null) ?? {};
  const cycle = ((meta.cycle as string) ?? "monthly") as Cycle;
  const provider = order.provider as PaymentProviderEnum;
  const gatewayEnumValue: PaymentGatewayEnum = provider; // enum now includes these

  const { data: plan, error: pErr } = await supabaseAdmin
    .from("billing_plans")
    .select("id, code, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
    .eq("id", planId)
    .single();
  if (pErr || !plan) throw new Error("Plan not found for order");

  const unitAmount =
    cycle === "monthly" ? plan.price_monthly_minor :
    cycle === "quarterly" ? plan.price_quarterly_minor :
    cycle === "yearly" ? plan.price_yearly_minor :
    plan.price_lifetime_minor;

  const nowIso = new Date().toISOString();
  const end = periodEnd(cycle);

  // 1. Existing subscription (determine action)
  const { data: existingSub } = await supabaseAdmin
    .from("billing_subscriptions")
    .select("id, plan_id, status, current_period_end")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  let action: LifecycleResult["action"] = "activated";
  if (existingSub) {
    if (existingSub.plan_id === plan.id) action = "renewed";
    else {
      const { data: oldPlan } = await supabaseAdmin
        .from("billing_plans")
        .select("code")
        .eq("id", existingSub.plan_id)
        .maybeSingle();
      action = planRank(plan.code) > planRank(oldPlan?.code) ? "upgraded" : "downgraded";
    }
  }

  // 2. Upsert subscription
  const { data: sub, error: sErr } = await supabaseAdmin
    .from("billing_subscriptions")
    .upsert(
      {
        workspace_id: workspaceId,
        plan_id: plan.id,
        status: "active",
        cycle,
        currency: order.currency ?? plan.currency ?? "INR",
        unit_amount_minor: unitAmount ?? Number(order.amount_paise ?? 0),
        quantity: 1,
        gateway: gatewayEnumValue,
        current_period_start: nowIso,
        current_period_end: end ? end.toISOString() : null,
        cancel_at_period_end: false,
        canceled_at: null,
        ended_at: null,
      } as never,
      { onConflict: "workspace_id" },
    )
    .select("id")
    .single();
  if (sErr || !sub) throw new Error(`Subscription upsert failed: ${sErr?.message}`);
  const subscriptionId = sub.id as string;

  // 3. Idempotent invoice create + mark paid
  //    Reuse existing open invoice bound to this order via metadata.order_id
  //    otherwise create a fresh one.
  const totalMinor = Number(order.amount_paise);
  const currency = order.currency ?? "INR";

  const { data: existingInvoice } = await supabaseAdmin
    .from("billing_invoices")
    .select("id, total_minor")
    .eq("workspace_id", workspaceId)
    .contains("metadata", { payment_order_id: input.orderId })
    .maybeSingle();

  let invoiceId: string;
  if (existingInvoice) {
    invoiceId = existingInvoice.id as string;
    await supabaseAdmin
      .from("billing_invoices")
      .update({
        status: "paid",
        subscription_id: subscriptionId,
        amount_paid_minor: totalMinor,
        amount_due_minor: 0,
        paid_at: nowIso,
        gateway: gatewayEnumValue,
      } as never)
      .eq("id", invoiceId);
  } else {
    const { data: invNumber } = await supabaseAdmin.rpc("next_invoice_number");
    const { data: newInv, error: nErr } = await supabaseAdmin
      .from("billing_invoices")
      .insert({
        workspace_id: workspaceId,
        subscription_id: subscriptionId,
        invoice_number: (invNumber as string | null) ?? null,
        status: "paid",
        currency,
        subtotal_minor: totalMinor,
        discount_minor: 0,
        tax_minor: 0,
        total_minor: totalMinor,
        amount_paid_minor: totalMinor,
        amount_due_minor: 0,
        line_items: [
          {
            description: `${plan.code} · ${cycle}`,
            quantity: 1,
            unit_amount_minor: unitAmount ?? totalMinor,
            amount_minor: totalMinor,
          },
        ],
        gateway: gatewayEnumValue,
        issued_at: nowIso,
        paid_at: nowIso,
        metadata: { payment_order_id: input.orderId } as never,
      } as never)
      .select("id")
      .single();
    if (nErr || !newInv) throw new Error(`Invoice create failed: ${nErr?.message}`);
    invoiceId = newInv.id as string;
  }

  // 4. Insert billing_payments (unique on gateway+gateway_payment_id)
  const gatewayPayId = input.gatewayPaymentId ?? `${provider}_${input.orderId}`;
  let paymentId: string;
  let duplicate = false;
  const { data: payInsert, error: payErr } = await supabaseAdmin
    .from("billing_payments")
    .insert({
      workspace_id: workspaceId,
      subscription_id: subscriptionId,
      invoice_id: invoiceId,
      gateway: gatewayEnumValue,
      status: "succeeded",
      amount_minor: totalMinor,
      currency,
      method: input.method ?? null,
      gateway_payment_id: gatewayPayId,
      gateway_order_id: (order.provider_order_id as string | null) ?? input.orderId,
      gateway_signature: input.gatewaySignature ?? null,
      payment_order_id: input.orderId,
      payment_gateway_id: (order.gateway_id as string | null) ?? null,
      captured_at: nowIso,
    } as never)
    .select("id")
    .single();
  if (payErr) {
    if ((payErr as { code?: string }).code === "23505") {
      // duplicate — find existing row
      const { data: existingPay } = await supabaseAdmin
        .from("billing_payments")
        .select("id")
        .eq("gateway", gatewayEnumValue)
        .eq("gateway_payment_id", gatewayPayId)
        .maybeSingle();
      paymentId = (existingPay?.id as string) ?? "";
      duplicate = true;
    } else {
      throw new Error(`Payment insert failed: ${payErr.message}`);
    }
  } else {
    paymentId = payInsert!.id as string;
  }

  // 5. Mark order paid
  await supabaseAdmin
    .from("payment_orders")
    .update({ status: "paid" } as never)
    .eq("id", input.orderId);

  if (duplicate) {
    return { ok: true, subscriptionId, invoiceId, paymentId, duplicate: true, action };
  }

  // 6. Emit billing event (best-effort, non-fatal)
  await supabaseAdmin
    .from("billing_events")
    .insert({
      workspace_id: workspaceId,
      event_type: `subscription.${action}`,
      subscription_id: subscriptionId,
      invoice_id: invoiceId,
      actor_id: input.actorUserId ?? null,
      to_plan: plan.code,
      amount_minor: totalMinor,
      currency,
      metadata: { payment_order_id: input.orderId, gateway: provider, cycle } as never,
    } as never);

  // 7. Notify workspace owner (best-effort)
  const { data: workspace } = await supabaseAdmin
    .from("workspaces")
    .select("owner_id, name")
    .eq("id", workspaceId)
    .maybeSingle();
  if (workspace?.owner_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: workspace.owner_id,
      workspace_id: workspaceId,
      type: "billing",
      channel: "in_app",
      title: `Subscription ${action}`,
      body: `${plan.code.toUpperCase()} plan · ${cycle} · paid via ${provider}.`,
      action_url: "/app/billing",
      metadata: { subscription_id: subscriptionId, invoice_id: invoiceId } as never,
    } as never);
  }

  return { ok: true, subscriptionId, invoiceId, paymentId, action };
}

/**
 * Mark a subscription cancelled. Idempotent.
 */
export async function markSubscriptionCancelled(input: {
  subscriptionId: string;
  atPeriodEnd: boolean;
  actorUserId?: string | null;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const patch = input.atPeriodEnd
    ? { cancel_at_period_end: true }
    : { status: "canceled", canceled_at: nowIso, ended_at: nowIso, cancel_at_period_end: false };

  const { data: sub, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .update(patch as never)
    .eq("id", input.subscriptionId)
    .select("workspace_id, plan_id")
    .single();
  if (error) throw error;

  await supabaseAdmin.from("billing_events").insert({
    workspace_id: sub!.workspace_id,
    event_type: input.atPeriodEnd ? "subscription.cancel_scheduled" : "subscription.cancelled",
    subscription_id: input.subscriptionId,
    actor_id: input.actorUserId ?? null,
  } as never);
}

/**
 * Record a failed payment attempt against an order — no subscription change.
 */
export async function recordFailedPayment(input: {
  orderId: string;
  reason?: string | null;
  gatewayPaymentId?: string | null;
}): Promise<void> {
  const { data: order } = await supabaseAdmin
    .from("payment_orders")
    .select("workspace_id, provider, amount_paise, currency, gateway_id")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order) return;

  await supabaseAdmin.from("billing_payments").insert({
    workspace_id: order.workspace_id,
    gateway: order.provider as PaymentGatewayEnum,
    status: "failed",
    amount_minor: Number(order.amount_paise ?? 0),
    currency: order.currency ?? "INR",
    gateway_payment_id: input.gatewayPaymentId ?? `${order.provider}_${input.orderId}_failed`,
    payment_order_id: input.orderId,
    payment_gateway_id: (order.gateway_id as string | null) ?? null,
    failure_reason: input.reason ?? null,
  } as never);

  await supabaseAdmin
    .from("payment_orders")
    .update({ status: "failed" } as never)
    .eq("id", input.orderId);
}
