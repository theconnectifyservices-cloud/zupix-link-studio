import { createFileRoute } from "@tanstack/react-router";
import { getAdapter } from "@/features/payments/gateways/registry";
import { extractEventId, extractOrderRef, extractStatus } from "@/features/payments/webhooks.server";
import type { PaymentGatewayPrivate, PaymentProvider } from "@/features/payments/types";

async function handleWebhook(provider: PaymentProvider, request: Request) {
  const raw = await request.text();
  const sig =
    request.headers.get("x-razorpay-signature") ||
    request.headers.get("x-webhook-signature") ||
    request.headers.get("x-signature") ||
    "";

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Find any live gateway for this provider (prefer live mode)
  const { data: gateways } = await supabaseAdmin
    .from("payment_gateways")
    .select("*")
    .eq("provider", provider)
    .eq("enabled", true)
    .order("mode", { ascending: false }); // 'sandbox' < 'live' alphabetically; still both attempted below

  let verified = false;
  let matched: PaymentGatewayPrivate | null = null;
  for (const g of gateways ?? []) {
    const priv = g as unknown as PaymentGatewayPrivate;
    if (getAdapter(provider).verifySignature(priv, raw, sig)) {
      verified = true;
      matched = priv;
      break;
    }
  }
  if (!verified) return new Response("Invalid signature", { status: 401 });

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventId = extractEventId(provider, payload);
  const orderRef = extractOrderRef(provider, payload);
  const status = extractStatus(provider, payload);

  // Idempotency: unique(provider, event_id)
  const { error: dupErr } = await supabaseAdmin
    .from("payment_webhook_events")
    .insert({
      provider,
      event_id: eventId,
      event_type: status,
      payload: payload as never,
    });
  if (dupErr) {
    // 23505 unique_violation → already processed, ack silently
    if ((dupErr as { code?: string }).code === "23505") return new Response("ok (dup)");
    return new Response(`db: ${dupErr.message}`, { status: 500 });
  }

  if (orderRef) {
    await supabaseAdmin
      .from("payment_orders")
      .update({ status })
      .eq("id", orderRef);

    if (status === "paid") {
      try {
        const p = (payload as { payload?: { payment?: { entity?: { id?: string; method?: string } } } })?.payload?.payment?.entity;
        const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
        await activateFromPaidOrder({
          orderId: orderRef,
          gatewayPaymentId: p?.id ?? null,
          method: p?.method ?? null,
        });
      } catch (e) {
        console.error("[razorpay webhook] lifecycle failed", e);
      }
    } else if (status === "failed") {
      const { recordFailedPayment } = await import("@/features/billing/lifecycle.server");
      await recordFailedPayment({ orderId: orderRef });
    }

    await supabaseAdmin
      .from("payment_webhook_events")
      .update({ order_id: orderRef, processed_at: new Date().toISOString() })
      .eq("provider", provider)
      .eq("event_id", eventId);
  }

  // Signal `matched` was used
  void matched;
  return new Response("ok");
}

export const Route = createFileRoute("/api/public/webhooks/razorpay")({
  server: {
    handlers: {
      POST: ({ request }) => handleWebhook("razorpay", request),
    },
  },
});
