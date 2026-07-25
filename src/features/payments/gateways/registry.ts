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

export const REGISTRY_META: Record<
  PaymentProvider,
  { label: string; logo: string; description: string; methods: string[] }
> = {
  razorpay: {
    label: "Razorpay",
    logo: "https://razorpay.com/favicon.png",
    description: "Cards, UPI, Net Banking, Wallets, EMI",
    methods: ["upi", "card", "netbanking", "wallet", "emi"],
  },
  payu: {
    label: "PayU",
    logo: "https://payu.in/favicon.ico",
    description: "Cards, UPI, Net Banking, Wallets",
    methods: ["upi", "card", "netbanking", "wallet"],
  },
  cashfree: {
    label: "Cashfree",
    logo: "https://www.cashfree.com/favicon.ico",
    description: "Cards, UPI, Net Banking, Wallets",
    methods: ["upi", "card", "netbanking", "wallet"],
  },
  manual_upi: {
    label: "Manual UPI",
    logo: "https://upipayments.co.in/favicon.ico",
    description: "Show QR, verify screenshot manually",
    methods: ["upi"],
  },
};
