/**
 * Server-only gateway registry: the adapters use Node `crypto`, so this module
 * must never be imported from a component. UI code imports `./meta` instead.
 */
import type { GatewayAdapter, PaymentProvider } from "../types";
import { razorpayAdapter } from "./razorpay.adapter";
import { payuAdapter } from "./payu.adapter";
import { cashfreeAdapter } from "./cashfree.adapter";
import { manualUpiAdapter } from "./manual-upi.adapter";

const ADAPTERS: Record<PaymentProvider, GatewayAdapter> = {
  razorpay: razorpayAdapter,
  payu: payuAdapter,
  cashfree: cashfreeAdapter,
  manual_upi: manualUpiAdapter,
};

export function getAdapter(provider: PaymentProvider): GatewayAdapter {
  const a = ADAPTERS[provider];
  if (!a) throw new Error(`Unknown payment provider: ${provider}`);
  return a;
}
