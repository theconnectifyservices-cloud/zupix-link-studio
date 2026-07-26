import { createFileRoute } from "@tanstack/react-router";
import { getAdapter } from "@/features/payments/gateways/registry";
import { extractEventId, extractOrderRef, extractStatus } from "@/features/payments/webhooks.server";
import type { PaymentGatewayPrivate } from "@/features/payments/types";

export const Route = createFileRoute("/api/public/webhooks/payu")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: gateways } = await supabaseAdmin
          .from("payment_gateways")
          .select("*")
          .eq("provider", "payu")
          .eq("enabled", true);
        let matched: PaymentGatewayPrivate | null = null;
        for (const g of gateways ?? []) {
          const priv = g as unknown as PaymentGatewayPrivate;
          if (getAdapter("payu").verifySignature(priv, raw, "")) {
            matched = priv;
            break;
          }
        }
        if (!matched) return new Response("Invalid signature", { status: 401 });
        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          const params = new URLSearchParams(raw);
          payload = Object.fromEntries(params);
        }
        const eventId = extractEventId("payu", payload);
        const orderRef = extractOrderRef("payu", payload);
        const status = extractStatus("payu", payload);

        const { error: dupErr } = await supabaseAdmin
          .from("payment_webhook_events")
          .insert({ provider: "payu", event_id: eventId, event_type: status, payload: payload as never });
        if (dupErr && (dupErr as { code?: string }).code === "23505") return new Response("ok (dup)");
        if (dupErr) return new Response(`db: ${dupErr.message}`, { status: 500 });

        if (orderRef) {
          await supabaseAdmin.from("payment_orders").update({ status }).eq("id", orderRef);
          if (status === "paid") {
            try {
              const p = payload as Record<string, string>;
              const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
              await activateFromPaidOrder({
                orderId: orderRef,
                gatewayPaymentId: p?.mihpayid ?? p?.txnid ?? null,
                method: p?.mode ?? null,
              });
            } catch (e) {
              console.error("[payu webhook] lifecycle failed", e);
            }
          } else if (status === "failed") {
            const { recordFailedPayment } = await import("@/features/billing/lifecycle.server");
            await recordFailedPayment({ orderId: orderRef });
          }
          await supabaseAdmin
            .from("payment_webhook_events")
            .update({ order_id: orderRef, processed_at: new Date().toISOString() })
            .eq("provider", "payu")
            .eq("event_id", eventId);
        }
        return new Response("ok");
      },
    },
  },
});
