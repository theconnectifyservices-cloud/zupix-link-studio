/**
 * LS-13A — Server functions for Razorpay checkout.
 * Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET env vars.
 * The publishable key id is echoed back to the browser; the secret never leaves the server.
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

async function requireWorkspaceAdmin(
  supabase: Awaited<ReturnType<typeof requireSupabaseAuth.server>>["context"]["supabase"],
  userId: string,
  workspaceId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("is_workspace_admin", {
    _user_id: userId,
    _workspace_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: workspace admin required");
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => CreateOrderInput.parse(v))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }

    const { supabase, userId } = context;
    await requireWorkspaceAdmin(supabase, userId, data.workspace_id);

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

    // Create Razorpay order via REST
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: quote.total_minor,
        currency: quote.currency,
        notes: {
          workspace_id: data.workspace_id,
          plan_code: plan.code,
          cycle: data.cycle,
          coupon_code: data.coupon_code ?? "",
        },
      }),
    });
    if (!rzpRes.ok) {
      const body = await rzpRes.text();
      throw new Error(`Razorpay order creation failed [${rzpRes.status}]: ${body}`);
    }
    const order = (await rzpRes.json()) as { id: string; amount: number; currency: string };

    // Persist a draft invoice + pending payment (server-only writes)
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
        gateway: "razorpay",
        gateway_invoice_id: null,
        issued_at: nowIso,
      } as never)
      .select("id")
      .single();
    if (invErr) throw new Error(invErr.message);

    const { error: payErr } = await supabaseAdmin.from("billing_payments").insert({
      workspace_id: data.workspace_id,
      invoice_id: invoice!.id,
      gateway: "razorpay",
      status: "pending",
      amount_minor: quote.total_minor,
      currency: quote.currency,
      gateway_order_id: order.id,
    } as never);
    if (payErr) throw new Error(payErr.message);

    return {
      order_id: order.id,
      key_id: keyId,
      amount_minor: order.amount,
      currency: order.currency,
      invoice_id: invoice!.id as string,
    };
  });
