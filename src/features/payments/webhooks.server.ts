import type { PaymentProvider } from "./types";

/** Extract a stable event id from a provider payload for idempotency. */
export function extractEventId(provider: PaymentProvider, payload: unknown): string {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (provider) {
    case "razorpay": {
      const evt = p.event as string | undefined;
      const pay = ((p.payload as Record<string, unknown>)?.payment as Record<string, unknown>)?.entity as
        | Record<string, unknown>
        | undefined;
      return `${evt ?? "event"}:${(pay?.id as string) ?? (p.id as string) ?? crypto.randomUUID()}`;
    }
    case "payu":
      return `payu:${(p.mihpayid as string) ?? (p.txnid as string) ?? crypto.randomUUID()}`;
    case "cashfree":
      return `cashfree:${((p.data as Record<string, unknown>)?.order as Record<string, unknown>)?.order_id as string ?? crypto.randomUUID()}`;
    default:
      return `${provider}:${crypto.randomUUID()}`;
  }
}

export function extractOrderRef(provider: PaymentProvider, payload: unknown): string | null {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (provider) {
    case "razorpay": {
      const order = ((p.payload as Record<string, unknown>)?.order as Record<string, unknown>)?.entity as
        | Record<string, unknown>
        | undefined;
      return (order?.receipt as string) ?? null;
    }
    case "payu":
      return (p.txnid as string) ?? null;
    case "cashfree":
      return (((p.data as Record<string, unknown>)?.order as Record<string, unknown>)?.order_id as string) ?? null;
    default:
      return null;
  }
}

export function extractStatus(provider: PaymentProvider, payload: unknown): "paid" | "failed" | "refunded" | "pending" {
  const p = (payload ?? {}) as Record<string, unknown>;
  switch (provider) {
    case "razorpay": {
      const evt = p.event as string | undefined;
      if (evt === "payment.captured") return "paid";
      if (evt === "payment.failed") return "failed";
      if (evt === "refund.processed" || evt === "refund.created") return "refunded";
      return "pending";
    }
    case "payu": {
      const s = String(p.status ?? "").toLowerCase();
      if (s === "success") return "paid";
      if (s === "failure" || s === "failed") return "failed";
      if (s === "refund") return "refunded";
      return "pending";
    }
    case "cashfree": {
      const t = String(p.type ?? "").toUpperCase();
      if (t.includes("SUCCESS")) return "paid";
      if (t.includes("FAILED")) return "failed";
      if (t.includes("REFUND")) return "refunded";
      return "pending";
    }
    default:
      return "pending";
  }
}
