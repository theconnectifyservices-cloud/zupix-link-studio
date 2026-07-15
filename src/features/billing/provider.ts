/**
 * LS-13A — Payment provider abstraction.
 *
 * Every concrete gateway (Razorpay, Stripe, Paddle, PayPal, manual) implements
 * this interface. The billing flow only talks to `PaymentProvider`, never to a
 * gateway SDK directly, so the platform stays fully usable even when no
 * credentials are configured — a `MockPaymentProvider` is transparently used
 * as the fallback.
 */
import type { BillingCycle, PaymentGateway } from "./types";

export interface CreateOrderRequest {
  workspace_id: string;
  plan_code: string;
  cycle: BillingCycle;
  coupon_code?: string | null;
}

export interface CreateOrderResult {
  order_id: string;
  key_id: string;
  amount_minor: number;
  currency: string;
  invoice_id: string;
  /** True when the order was minted by the mock provider. */
  mock: boolean;
}

export interface VerifyPaymentRequest {
  workspace_id: string;
  invoice_id: string;
  plan_code: string;
  cycle: BillingCycle;
  /** Gateway-specific fields. */
  payment_id: string;
  order_id: string;
  signature?: string;
}

export interface ProviderStatus {
  gateway: PaymentGateway;
  connected: boolean;
  mode: "live" | "test" | "mock" | "unconfigured";
  key_id?: string | null;
  webhook_configured?: boolean;
  message?: string;
}

export interface PaymentProvider {
  readonly gateway: PaymentGateway;
  status(): ProviderStatus;
  createOrder(req: CreateOrderRequest & { amount_minor: number; currency: string }): Promise<Omit<CreateOrderResult, "invoice_id">>;
  verifyPayment(req: VerifyPaymentRequest): Promise<{ ok: true } | { ok: false; reason: string }>;
}
