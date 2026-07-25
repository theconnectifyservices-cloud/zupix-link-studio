import { createHmac, timingSafeEqual } from "crypto";
import type { GatewayAdapter, PaymentGatewayPrivate, CreateOrderInput, CreateOrderResult, HealthResult } from "../types";

const HOST_LIVE = "https://api.razorpay.com";

export const razorpayAdapter: GatewayAdapter = {
  provider: "razorpay",
  supportedMethods: ["upi", "card", "netbanking", "wallet", "emi"],

  async createOrder(gw, input, orderId): Promise<CreateOrderResult> {
    const keyId = gw.credentials.key_id;
    const keySecret = gw.credentials.key_secret;
    if (!keyId || !keySecret) throw new Error("Razorpay credentials missing");

    const res = await fetch(`${HOST_LIVE}/v1/orders`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: input.amountPaise,
        currency: input.currency,
        receipt: orderId,
        notes: { workspace_id: input.workspaceId, plan_id: input.planId },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Razorpay order failed: ${res.status} ${t.slice(0, 200)}`);
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      orderId,
      provider: "razorpay",
      launch: {
        kind: "razorpay",
        keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    };
  },

  verifySignature(gw, rawBody, signature) {
    const secret = gw.webhook_secret ?? gw.credentials.key_secret;
    if (!secret || !signature) return false;
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  },

  async health(gw): Promise<HealthResult> {
    const keyId = gw.credentials.key_id;
    const keySecret = gw.credentials.key_secret;
    if (!keyId || !keySecret) return { status: "down", message: "Missing credentials" };
    try {
      const res = await fetch(`${HOST_LIVE}/v1/payments?count=1`, {
        headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
      });
      if (res.ok) return { status: "healthy", message: "OK" };
      if (res.status === 401) return { status: "down", message: "Auth failed" };
      return { status: "degraded", message: `HTTP ${res.status}` };
    } catch (e) {
      return { status: "down", message: (e as Error).message };
    }
  },
};
