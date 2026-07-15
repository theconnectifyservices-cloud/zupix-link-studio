/**
 * LS-13A — Razorpay client helpers (browser only).
 * Loads Checkout.js on demand and opens the modal with a server-created order.
 */

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; on: (e: string, cb: (p: unknown) => void) => void };
  }
}

export interface RazorpayOrder {
  order_id: string;
  key_id: string;
  amount_minor: number;
  currency: string;
  invoice_id?: string;
  subscription_id?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

let loading: Promise<void> | null = null;
export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay is browser-only"));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Failed to load Razorpay Checkout"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export async function openRazorpayCheckout(
  order: RazorpayOrder,
  meta: { workspaceName: string; description: string; prefill?: RazorpayOptions["prefill"] },
): Promise<{ razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }> {
  await loadRazorpayCheckout();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: order.key_id,
      amount: order.amount_minor,
      currency: order.currency,
      name: meta.workspaceName,
      description: meta.description,
      order_id: order.order_id,
      prefill: meta.prefill,
      notes: order.invoice_id ? { invoice_id: order.invoice_id } : undefined,
      theme: { color: "#6366f1" },
      handler: (resp) => resolve(resp),
      modal: { ondismiss: () => reject(new Error("Checkout dismissed")) },
    });
    rzp.open();
  });
}
