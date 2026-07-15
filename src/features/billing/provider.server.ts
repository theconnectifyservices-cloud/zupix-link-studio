/**
 * LS-13A — Server-side payment provider factory.
 *
 * Picks a concrete provider based on which credentials are configured. Falls
 * back to the mock provider so development and preview flows never break.
 * Import this ONLY from server functions or route handlers.
 */
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type {
  CreateOrderRequest,
  CreateOrderResult,
  PaymentProvider,
  ProviderStatus,
  VerifyPaymentRequest,
} from "./provider";

class MockPaymentProvider implements PaymentProvider {
  readonly gateway = "manual" as const;

  status(): ProviderStatus {
    return {
      gateway: this.gateway,
      connected: false,
      mode: "mock",
      message: "No live gateway configured. Using demo checkout — no real charges.",
    };
  }

  async createOrder(
    req: CreateOrderRequest & { amount_minor: number; currency: string },
  ): Promise<Omit<CreateOrderResult, "invoice_id">> {
    return {
      order_id: `mock_${randomUUID()}`,
      key_id: "mock",
      amount_minor: req.amount_minor,
      currency: req.currency,
      mock: true,
    };
  }

  async verifyPayment(req: VerifyPaymentRequest) {
    // Mock provider accepts any signature-shaped payload; treat any order that
    // starts with `mock_` as valid.
    if (!req.order_id.startsWith("mock_")) {
      return { ok: false as const, reason: "Mock provider only accepts mock orders" };
    }
    return { ok: true as const };
  }
}

class RazorpayPaymentProvider implements PaymentProvider {
  readonly gateway = "razorpay" as const;
  private readonly keyId: string;
  private readonly keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  status(): ProviderStatus {
    return {
      gateway: this.gateway,
      connected: true,
      mode: this.keyId.startsWith("rzp_live_") ? "live" : "test",
      key_id: this.keyId,
      webhook_configured: !!process.env.RAZORPAY_WEBHOOK_SECRET,
    };
  }

  async createOrder(
    req: CreateOrderRequest & { amount_minor: number; currency: string },
  ): Promise<Omit<CreateOrderResult, "invoice_id">> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: req.amount_minor,
        currency: req.currency,
        notes: {
          workspace_id: req.workspace_id,
          plan_code: req.plan_code,
          cycle: req.cycle,
          coupon_code: req.coupon_code ?? "",
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Razorpay order creation failed [${res.status}]: ${body}`);
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return {
      order_id: order.id,
      key_id: this.keyId,
      amount_minor: order.amount,
      currency: order.currency,
      mock: false,
    };
  }

  async verifyPayment(req: VerifyPaymentRequest) {
    if (!req.signature) return { ok: false as const, reason: "Missing signature" };
    const expected = createHmac("sha256", this.keySecret)
      .update(`${req.order_id}|${req.payment_id}`)
      .digest("hex");
    const sig = Buffer.from(req.signature);
    const exp = Buffer.from(expected);
    if (sig.length !== exp.length || !timingSafeEqual(sig, exp)) {
      return { ok: false as const, reason: "Invalid signature" };
    }
    return { ok: true as const };
  }
}

/**
 * Return the currently active payment provider. Never throws — always yields
 * a working provider so the UI stays interactive.
 */
export function getPaymentProvider(): PaymentProvider {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (keyId && keySecret) return new RazorpayPaymentProvider(keyId, keySecret);
  return new MockPaymentProvider();
}

export function getProviderStatus(): ProviderStatus {
  return getPaymentProvider().status();
}
