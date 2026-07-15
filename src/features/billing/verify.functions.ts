/**
 * LS-13A — Server function to verify a checkout payment via the abstract
 * PaymentProvider. Works with mock and Razorpay providers.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VerifyInput = z.object({
  workspace_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  order_id: z.string().min(1),
  payment_id: z.string().min(1),
  signature: z.string().optional().nullable(),
  plan_code: z.string().min(1),
  cycle: z.enum(["monthly", "quarterly", "yearly", "lifetime"]),
});

function periodEnd(cycle: string, from = new Date()): Date | null {
  const d = new Date(from);
  switch (cycle) {
    case "monthly": d.setMonth(d.getMonth() + 1); return d;
    case "quarterly": d.setMonth(d.getMonth() + 3); return d;
    case "yearly": d.setFullYear(d.getFullYear() + 1); return d;
    case "lifetime": return null;
    default: return null;
  }
}

export const verifyCheckoutPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => VerifyInput.parse(v))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_workspace_admin", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdmin) throw new Error("Forbidden: workspace admin required");

    const { getPaymentProvider } = await import("./provider.server");
    const provider = getPaymentProvider();
    const result = await provider.verifyPayment({
      workspace_id: data.workspace_id,
      invoice_id: data.invoice_id,
      plan_code: data.plan_code,
      cycle: data.cycle,
      order_id: data.order_id,
      payment_id: data.payment_id,
      signature: data.signature ?? undefined,
    });
    if (!result.ok) throw new Error(result.reason);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();

    const { error: payErr } = await supabaseAdmin
      .from("billing_payments")
      .update({
        status: "succeeded",
        gateway_payment_id: data.payment_id,
        captured_at: nowIso,
      } as never)
      .eq("gateway_order_id", data.order_id)
      .eq("workspace_id", data.workspace_id);
    if (payErr) throw new Error(payErr.message);

    const { data: invoice, error: invFetchErr } = await supabaseAdmin
      .from("billing_invoices")
      .select("total_minor")
      .eq("id", data.invoice_id)
      .single();
    if (invFetchErr) throw new Error(invFetchErr.message);
    const { error: invErr } = await supabaseAdmin
      .from("billing_invoices")
      .update({
        status: "paid",
        amount_paid_minor: invoice!.total_minor,
        amount_due_minor: 0,
        paid_at: nowIso,
      } as never)
      .eq("id", data.invoice_id);
    if (invErr) throw new Error(invErr.message);

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("billing_plans")
      .select("id, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor, currency")
      .eq("code", data.plan_code)
      .single();
    if (planErr) throw new Error(planErr.message);

    const unit =
      data.cycle === "monthly" ? plan!.price_monthly_minor :
      data.cycle === "quarterly" ? plan!.price_quarterly_minor :
      data.cycle === "yearly" ? plan!.price_yearly_minor :
      plan!.price_lifetime_minor;

    const end = periodEnd(data.cycle);
    const { error: subErr } = await supabaseAdmin
      .from("billing_subscriptions")
      .upsert(
        {
          workspace_id: data.workspace_id,
          plan_id: plan!.id,
          status: "active",
          cycle: data.cycle,
          currency: plan!.currency,
          unit_amount_minor: unit ?? 0,
          quantity: 1,
          gateway: provider.gateway,
          current_period_start: nowIso,
          current_period_end: end ? end.toISOString() : null,
          cancel_at_period_end: false,
          canceled_at: null,
          ended_at: null,
        } as never,
        { onConflict: "workspace_id" },
      );
    if (subErr) throw new Error(subErr.message);

    return { ok: true, mock: provider.gateway === "manual" };
  });
