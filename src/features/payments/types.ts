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

/** JSON-serializable scalar tree. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

interface PaymentGatewayBase {
  id: string;
  workspace_id: string | null;
  provider: PaymentProvider;
  display_name: string;
  enabled: boolean;
  mode: PaymentMode;
  priority: number;
  health_status: HealthStatus;
  health_message: string | null;
  health_checked_at: string | null;
  /** Non-secret config: UPI id, QR image url, instructions, supported_methods. */
  config: Record<string, JsonValue>;
  created_at: string;
  updated_at: string;
}

/** Safe (client-facing) gateway shape — never includes raw secrets. */
export interface PaymentGatewayPublic extends PaymentGatewayBase {
  has_credentials: boolean;
  has_webhook_secret: boolean;
}

/** Server-only shape — includes credentials. Never returned to client. */
export interface PaymentGatewayPrivate extends PaymentGatewayBase {
  credentials: Record<string, string>;
  webhook_secret: string | null;
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

export type LaunchPayload =
  | { kind: "razorpay"; keyId: string; orderId: string; amount: number; currency: string }
  | { kind: "payu"; endpoint: string; fields: Record<string, string> }
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

export interface CreateOrderResult {
  orderId: string; // internal payment_orders.id
  provider: PaymentProvider;
  launch: LaunchPayload;
}

export interface HealthResult {
  status: HealthStatus;
  message: string;
}

export interface GatewayAdapter {
  provider: PaymentProvider;
  supportedMethods: string[];
  createOrder(
    gateway: PaymentGatewayPrivate,
    input: CreateOrderInput,
    orderId: string,
  ): Promise<CreateOrderResult>;
  verifySignature(
    gateway: PaymentGatewayPrivate,
    rawBody: string,
    signature: string,
  ): boolean;
  health(gateway: PaymentGatewayPrivate): Promise<HealthResult>;
}

/** Server -> client redactor. */
export function redactGateway(g: Record<string, unknown>): PaymentGatewayPublic {
  const creds = (g.credentials as Record<string, string> | null) ?? {};
  return {
    id: String(g.id),
    workspace_id: (g.workspace_id as string | null) ?? null,
    provider: g.provider as PaymentProvider,
    display_name: String(g.display_name ?? ""),
    enabled: Boolean(g.enabled),
    mode: (g.mode as PaymentMode) ?? "sandbox",
    priority: Number(g.priority ?? 100),
    health_status: (g.health_status as HealthStatus) ?? "unknown",
    health_message: (g.health_message as string | null) ?? null,
    health_checked_at: (g.health_checked_at as string | null) ?? null,
    config: ((g.config as Record<string, JsonValue>) ?? {}),
    created_at: String(g.created_at),
    updated_at: String(g.updated_at),
    has_credentials: Object.keys(creds).length > 0,
    has_webhook_secret: Boolean(g.webhook_secret),
  };
}
