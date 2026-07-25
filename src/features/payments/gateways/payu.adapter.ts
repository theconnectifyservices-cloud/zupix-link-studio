import { createHash } from "crypto";
import type { GatewayAdapter, HealthResult } from "../types";

const ENDPOINTS = {
  sandbox: "https://test.payu.in/_payment",
  live: "https://secure.payu.in/_payment",
};

export const payuAdapter: GatewayAdapter = {
  provider: "payu",
  supportedMethods: ["upi", "card", "netbanking", "wallet"],

  async createOrder(gw, input, orderId) {
    const key = gw.credentials.merchant_key;
    const salt = gw.credentials.merchant_salt;
    if (!key || !salt) throw new Error("PayU credentials missing");

    const txnid = orderId.replace(/-/g, "").slice(0, 24);
    const amount = (input.amountPaise / 100).toFixed(2);
    const productinfo = `plan_${input.planId}`;
    const firstname = input.customer.name || "Customer";
    const email = input.customer.email;
    const phone = input.customer.phone ?? "";
    const surl = `${input.returnUrl}?status=success&order=${orderId}`;
    const furl = `${input.returnUrl}?status=failure&order=${orderId}`;

    // PayU hash: sha512(key|txnid|amount|productinfo|firstname|email|||||||||||salt)
    const hashStr = [key, txnid, amount, productinfo, firstname, email, "", "", "", "", "", "", "", "", "", "", salt].join("|");
    const hash = createHash("sha512").update(hashStr).digest("hex");

    return {
      orderId,
      provider: "payu",
      launch: {
        kind: "payu",
        endpoint: ENDPOINTS[gw.mode],
        fields: {
          key, txnid, amount, productinfo, firstname, email, phone, surl, furl, hash,
        },
      },
    };
  },

  verifySignature(gw, rawBody) {
    // PayU S2S: hash = sha512(salt|status|udf10|...|key)
    const salt = gw.credentials.merchant_salt;
    if (!salt) return false;
    try {
      const p = JSON.parse(rawBody) as Record<string, string>;
      const key = gw.credentials.merchant_key;
      const chain = [
        salt, p.status, "", "", "", "", "", p.udf5 ?? "", p.udf4 ?? "", p.udf3 ?? "",
        p.udf2 ?? "", p.udf1 ?? "", p.email, p.firstname, p.productinfo, p.amount, p.txnid, key,
      ].join("|");
      const expected = createHash("sha512").update(chain).digest("hex");
      return expected === (p.hash ?? "").toLowerCase();
    } catch {
      return false;
    }
  },

  async health(gw): Promise<HealthResult> {
    if (!gw.credentials.merchant_key || !gw.credentials.merchant_salt) {
      return { status: "down", message: "Missing credentials" };
    }
    try {
      const res = await fetch(ENDPOINTS[gw.mode], { method: "GET" });
      return res.status < 500
        ? { status: "healthy", message: "Endpoint reachable" }
        : { status: "degraded", message: `HTTP ${res.status}` };
    } catch (e) {
      return { status: "down", message: (e as Error).message };
    }
  },
};
