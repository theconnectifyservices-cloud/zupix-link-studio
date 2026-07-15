/**
 * LS-13A — Server function to verify a Razorpay checkout signature.
 * Runs after the browser callback; on success the webhook is the source of
 * truth for subscription lifecycle, but we mark the payment/invoice paid
 * here so the UI reflects success immediately.
 */
import { createServerFn } from "@tanstack/react-start";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VerifyInput = z.object({
  workspace_id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
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

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v) => VerifyInput.parse(v))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");

    const { supabase, userId } = context;
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_workspace_admin", {
      _user_id: userId,
      _workspace_id: data.workspace_id,
    });
    if (adminErr) throw new Error(adminErr.message);
    if (!isAdmin) throw new Error("Forbidden: workspace admin required");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const sigBuf = Buffer.from(data.razorpay_signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      throw new Error("Invalid Razorpay signature");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const nowIso = new Date().toISOString();

    // Mark payment succeeded
    const { error: payErr } = await supabaseAdmin
      .from("billing_payments")
      .update({
        status: "succeeded",
        gateway_payment_id: data.razorpay_payment_id,
        captured_at: nowIso,
      } as never)
      .eq("gateway_order_id", data.razorpay_order_id)
      .eq("workspace_id", data.workspace_id);
    if (payErr) throw new Error(payErr.message);

    // Mark invoice paid
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

    // Upsert local subscription record
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
          gateway: "razorpay",
          current_period_start: nowIso,
          current_period_end: end ? end.toISOString() : null,
          cancel_at_period_end: false,
          canceled_at: null,
          ended_at: null,
        } as never,
        { onConflict: "workspace_id" },
      );
    if (subErr) throw new Error(subErr.message);

    return { ok: true };
  });
