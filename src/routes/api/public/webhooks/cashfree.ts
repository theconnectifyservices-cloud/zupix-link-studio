import { createFileRoute } from "@tanstack/react-router";
import { getAdapter } from "@/features/payments/gateways/registry";
import { extractEventId, extractOrderRef, extractStatus } from "@/features/payments/webhooks.server";
import type { PaymentGatewayPrivate } from "@/features/payments/types";

export const Route = createFileRoute("/api/public/webhooks/cashfree")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const sig = request.headers.get("x-webhook-signature") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: gateways } = await supabaseAdmin
          .from("payment_gateways")
          .select("*")
          .eq("provider", "cashfree")
          .eq("enabled", true);
        let matched: PaymentGatewayPrivate | null = null;
        for (const g of gateways ?? []) {
          const priv = g as unknown as PaymentGatewayPrivate;
          if (getAdapter("cashfree").verifySignature(priv, raw, sig)) {
            matched = priv;
            break;
          }
        }
        if (!matched) return new Response("Invalid signature", { status: 401 });
        let payload: unknown;
        try { payload = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
        const eventId = extractEventId("cashfree", payload);
        const orderRef = extractOrderRef("cashfree", payload);
        const status = extractStatus("cashfree", payload);

        const { error: dupErr } = await supabaseAdmin
          .from("payment_webhook_events")
          .insert({ provider: "cashfree", event_id: eventId, event_type: status, payload: payload as never });
        if (dupErr && (dupErr as { code?: string }).code === "23505") return new Response("ok (dup)");
        if (dupErr) return new Response(`db: ${dupErr.message}`, { status: 500 });

        if (orderRef) {
          await supabaseAdmin.from("payment_orders").update({ status }).eq("id", orderRef);
          if (status === "paid") {
            try {
              const d = ((payload as { data?: { payment?: { cf_payment_id?: string; payment_method?: string } } })?.data)?.payment;
              const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
              await activateFromPaidOrder({
                orderId: orderRef,
                gatewayPaymentId: d?.cf_payment_id ?? null,
                method: d?.payment_method ?? null,
              });
            } catch (e) {
              console.error("[cashfree webhook] lifecycle failed", e);
            }
          } else if (status === "failed") {
            const { recordFailedPayment } = await import("@/features/billing/lifecycle.server");
            await recordFailedPayment({ orderId: orderRef });
          }
          await supabaseAdmin
            .from("payment_webhook_events")
            .update({ order_id: orderRef, processed_at: new Date().toISOString() })
            .eq("provider", "cashfree")
            .eq("event_id", eventId);
        }
        return new Response("ok");
      },
    },
  },
});
