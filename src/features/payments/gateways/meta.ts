/**
 * Client-safe gateway metadata.
 *
 * Kept separate from `registry.ts` on purpose: the registry pulls in the
 * adapters, which use Node's `crypto` for signature verification. Importing
 * the registry from a component would break the browser bundle, so any UI that
 * only needs labels/logos imports this module instead.
 */
import type { PaymentProvider } from "../types";

export interface GatewayMeta {
  label: string;
  logo: string;
  description: string;
  methods: string[];
}

export const REGISTRY_META: Record<PaymentProvider, GatewayMeta> = {
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
