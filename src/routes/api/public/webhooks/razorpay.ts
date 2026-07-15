/**
 * LS-13A — Razorpay webhook.
 * Configure at: dashboard.razorpay.com → Settings → Webhooks
 * URL: https://<your-domain>/api/public/webhooks/razorpay
 * Secret: value stored in RAZORPAY_WEBHOOK_SECRET
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const sig = Buffer.from(signature);
        const exp = Buffer.from(expected);
        if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: {
          event?: string;
          payload?: {
            payment?: { entity?: Record<string, unknown> };
            subscription?: { entity?: Record<string, unknown> };
            order?: { entity?: Record<string, unknown> };
          };
        };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const event = payload.event ?? "";
        const payment = payload.payload?.payment?.entity as Record<string, unknown> | undefined;
        const sub = payload.payload?.subscription?.entity as Record<string, unknown> | undefined;
        const nowIso = new Date().toISOString();

        try {
          if (event === "payment.captured" && payment) {
            await supabaseAdmin
              .from("billing_payments")
              .update({
                status: "succeeded",
                gateway_payment_id: payment.id as string,
                captured_at: nowIso,
              } as never)
              .eq("gateway_order_id", payment.order_id as string);
          } else if (event === "payment.failed" && payment) {
            await supabaseAdmin
              .from("billing_payments")
              .update({
                status: "failed",
                gateway_payment_id: payment.id as string,
                failure_reason:
                  ((payment.error_description as string) || (payment.error_reason as string)) ?? null,
              } as never)
              .eq("gateway_order_id", payment.order_id as string);
          } else if (event === "subscription.cancelled" && sub) {
            await supabaseAdmin
              .from("billing_subscriptions")
              .update({
                status: "canceled",
                canceled_at: nowIso,
                ended_at: nowIso,
              } as never)
              .eq("gateway_subscription_id", sub.id as string);
          } else if (event === "subscription.paused" && sub) {
            await supabaseAdmin
              .from("billing_subscriptions")
              .update({ status: "paused", paused_at: nowIso } as never)
              .eq("gateway_subscription_id", sub.id as string);
          } else if (event === "subscription.resumed" && sub) {
            await supabaseAdmin
              .from("billing_subscriptions")
              .update({ status: "active", resumed_at: nowIso } as never)
              .eq("gateway_subscription_id", sub.id as string);
          }
        } catch (e) {
          console.error("Razorpay webhook processing error", e);
          return new Response("Processing error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
