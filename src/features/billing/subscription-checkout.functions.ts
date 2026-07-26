/**
 * Subscription checkout entry-point. Resolves the billing_plans row for a
 * plan code + cycle, returns everything the payments CheckoutModal needs to
 * launch a multi-gateway checkout.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  workspaceId: z.string().uuid(),
  planCode: z.string().min(1),
  cycle: z.enum(["monthly", "quarterly", "yearly", "lifetime"]),
});

export const resolveSubscriptionCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => Input.parse(v))
  .handler(async ({ data, context }) => {
    const { data: plan, error } = await context.supabase
      .from("billing_plans")
      .select("id, code, name, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
      .eq("code", data.planCode)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!plan) throw new Error(`Plan not found: ${data.planCode}`);

    const priceMinor =
      data.cycle === "monthly" ? plan.price_monthly_minor :
      data.cycle === "quarterly" ? plan.price_quarterly_minor :
      data.cycle === "yearly" ? plan.price_yearly_minor :
      plan.price_lifetime_minor;
    if (!priceMinor || priceMinor <= 0) throw new Error("This plan is free or unavailable on the selected cycle");

    return {
      planId: plan.id as string,
      planName: plan.name as string,
      amountPaise: priceMinor,
      currency: (plan.currency as string) ?? "INR",
    };
  });

/** Admin-triggered manual activation from an existing paid order. */
export const adminActivateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => d)
  .handler(async ({ data, context }) => {
    const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (!isSuper && !isAdmin) throw new Error("Admin role required");
    const { activateFromPaidOrder } = await import("./lifecycle.server");
    return activateFromPaidOrder({ orderId: data.orderId, actorUserId: context.userId });
  });

/** Mock-checkout: activate a subscription without going through a gateway. Dev/QA only. */
export const mockActivateSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => Input.parse(v))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_workspace_admin", {
      _user_id: context.userId,
      _workspace_id: data.workspaceId,
    });
    if (!isAdmin) throw new Error("Workspace admin required");

    const { data: plan, error } = await context.supabase
      .from("billing_plans")
      .select("id, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
      .eq("code", data.planCode)
      .maybeSingle();
    if (error || !plan) throw new Error("Plan not found");
    const priceMinor =
      data.cycle === "monthly" ? plan.price_monthly_minor :
      data.cycle === "quarterly" ? plan.price_quarterly_minor :
      data.cycle === "yearly" ? plan.price_yearly_minor :
      plan.price_lifetime_minor;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error: oErr } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        workspace_id: data.workspaceId,
        user_id: context.userId,
        plan_id: plan.id,
        provider: "manual_upi",
        amount_paise: priceMinor ?? 0,
        currency: plan.currency ?? "INR",
        idempotency_key: `mock_${crypto.randomUUID()}`,
        status: "paid",
        meta: { cycle: data.cycle, mock: true } as never,
      } as never)
      .select("id")
      .single();
    if (oErr || !order) throw oErr ?? new Error("Order create failed");

    const { activateFromPaidOrder } = await import("./lifecycle.server");
    return activateFromPaidOrder({
      orderId: order.id as string,
      gatewayPaymentId: `mock_${order.id}`,
      method: "mock",
      actorUserId: context.userId,
    });
  });
