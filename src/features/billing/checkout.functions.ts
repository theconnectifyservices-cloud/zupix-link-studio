/**
 * LS-13A — Server functions for checkout.
 *
 * Uses the abstract PaymentProvider layer, so this works with or without
 * Razorpay credentials. Without credentials it transparently produces a mock
 * order and the UI runs in demo mode.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeQuote } from "./pricing";
import type { BillingCycle, BillingPlan, Coupon, TaxSettings } from "./types";

const CreateOrderInput = z.object({
  workspace_id: z.string().uuid(),
  plan_code: z.string().min(1),
  cycle: z.enum(["monthly", "quarterly", "yearly", "lifetime"]),
  coupon_code: z.string().trim().optional().nullable(),
});

export const getBillingProviderStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { getProviderStatus } = await import("./provider.server");
  return getProviderStatus();
});

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CreateOrderInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_workspace_admin", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdmin) throw new Error("Forbidden: workspace admin required");

    const { data: plan, error: planErr } = await supabase
      .from("billing_plans")
      .select("*")
      .eq("code", data.plan_code)
      .eq("is_active", true)
      .maybeSingle();
    if (planErr) throw new Error(planErr.message);
    if (!plan) throw new Error("Plan not found");

    let coupon: Coupon | null = null;
    if (data.coupon_code) {
      const { data: c } = await supabase
        .from("billing_coupons")
        .select("*")
        .eq("code", data.coupon_code)
        .eq("is_active", true)
        .maybeSingle();
      coupon = (c as unknown as Coupon | null) ?? null;
    }

    const { data: tax } = await supabase
      .from("billing_tax_settings")
      .select("tax_rate, prices_include_tax")
      .eq("workspace_id", data.workspace_id)
      .maybeSingle();

    const quote = computeQuote({
      plan: plan as unknown as BillingPlan,
      cycle: data.cycle as BillingCycle,
      coupon,
      tax: (tax as Pick<TaxSettings, "tax_rate" | "prices_include_tax"> | null) ?? null,
    });
    if (!quote) throw new Error("This plan is not available for the selected billing cycle");
    if (quote.total_minor <= 0) throw new Error("Order total must be greater than zero");

    const { getPaymentProvider } = await import("./provider.server");
    const provider = getPaymentProvider();
    const order = await provider.createOrder({
      workspace_id: data.workspace_id,
      plan_code: plan.code,
      cycle: data.cycle as BillingCycle,
      coupon_code: data.coupon_code,
      amount_minor: quote.total_minor,
      currency: quote.currency,
    });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from("billing_invoices")
      .insert({
        workspace_id: data.workspace_id,
        status: "open",
        currency: quote.currency,
        subtotal_minor: quote.subtotal_minor,
        discount_minor: quote.discount_minor,
        tax_minor: quote.tax_minor,
        total_minor: quote.total_minor,
        amount_due_minor: quote.total_minor,
        line_items: [
          {
            description: `${plan.name} · ${data.cycle}`,
            quantity: 1,
            unit_amount_minor: quote.unit_amount_minor,
            amount_minor: quote.subtotal_minor,
          },
        ],
        tax_details: { rate: quote.tax_rate, inclusive: quote.prices_include_tax },
        gateway: provider.gateway,
        issued_at: nowIso,
      } as never)
      .select("id")
      .single();
    if (invErr) throw new Error(invErr.message);

    const { error: payErr } = await supabaseAdmin.from("billing_payments").insert({
      workspace_id: data.workspace_id,
      invoice_id: invoice!.id,
      gateway: provider.gateway,
      status: "pending",
      amount_minor: quote.total_minor,
      currency: quote.currency,
      gateway_order_id: order.order_id,
    } as never);
    if (payErr) throw new Error(payErr.message);

    return {
      order_id: order.order_id,
      key_id: order.key_id,
      amount_minor: order.amount_minor,
      currency: order.currency,
      invoice_id: invoice!.id as string,
      mock: order.mock,
      gateway: provider.gateway,
    };
  });
