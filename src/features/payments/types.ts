/**
 * Enterprise Payment Gateway Hub — shared types.
 * Money moves as integer minor units (paise). Never floats.
 */

export type PaymentProvider = "razorpay" | "payu" | "cashfree" | "manual_upi";
export type PaymentMode = "sandbox" | "live";
export type PaymentOrderStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"
  | "manual_review";
export type HealthStatus = "unknown" | "healthy" | "degraded" | "down";

/** Safe (client-facing) gateway shape — never includes raw secrets. */
export interface PaymentGatewayPublic {
  id: string;
  workspace_id: string | null;
  provider: PaymentProvider;
  display_name: string;
  enabled: boolean;
  mode: PaymentMode;
  priority: number;
  has_credentials: boolean;
  has_webhook_secret: boolean;
  health_status: HealthStatus;
  health_message: string | null;
  health_checked_at: string | null;
  /** Non-secret config: UPI id, QR image url, instructions, supported_methods. */
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  workspaceId: string;
  planId: string;
  cycle: "monthly" | "quarterly" | "yearly" | "lifetime";
  amountPaise: number;
  currency: string;
  customer: { name: string; email: string; phone?: string };
  returnUrl: string;
}

export interface CreateOrderResult {
  orderId: string; // internal payment_orders.id
  provider: PaymentProvider;
  /** Adapter-specific payload the client uses to launch checkout. */
  launch:
    | { kind: "razorpay"; keyId: string; orderId: string; amount: number; currency: string }
    | {
        kind: "payu";
        endpoint: string;
        fields: Record<string, string>;
      }
    | { kind: "cashfree"; sessionId: string; mode: PaymentMode }
    | {
        kind: "manual_upi";
        upiId: string;
        accountName: string;
        qrImageUrl: string | null;
        amountPaise: number;
        instructions: string;
        orderRef: string;
      };
}

export interface HealthResult {
  status: HealthStatus;
  message: string;
}

export interface GatewayAdapter {
  provider: PaymentProvider;
  supportedMethods: string[]; // e.g. ["upi","card","netbanking","wallet","emi"]
  /** Called from server; must not touch DOM. */
  createOrder(
    gateway: PaymentGatewayPrivate,
    input: CreateOrderInput,
    orderId: string,
  ): Promise<CreateOrderResult>;
  /** Verify signature of a returned payment/webhook payload. */
  verifySignature(
    gateway: PaymentGatewayPrivate,
    rawBody: string,
    signature: string,
  ): boolean;
  /** Lightweight health probe (no live charge). */
  health(gateway: PaymentGatewayPrivate): Promise<HealthResult>;
}

/** Server-only shape — includes credentials. Never returned to client. */
export interface PaymentGatewayPrivate extends PaymentGatewayPublic {
  credentials: Record<string, string>;
  webhook_secret: string | null;
}

export function redactGateway(g: PaymentGatewayPrivate): PaymentGatewayPublic {
  const { credentials, webhook_secret, ...rest } = g;
  return {
    ...rest,
    has_credentials: Object.keys(credentials ?? {}).length > 0,
    has_webhook_secret: Boolean(webhook_secret),
  };
}
