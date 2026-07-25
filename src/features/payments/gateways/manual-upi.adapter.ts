import type { GatewayAdapter } from "../types";

export const manualUpiAdapter: GatewayAdapter = {
  provider: "manual_upi",
  supportedMethods: ["upi"],

  async createOrder(gw, input, orderId) {
    const upiId = String(gw.config.upi_id ?? "");
    const accountName = String(gw.config.account_name ?? "Merchant");
    const qrImageUrl = (gw.config.qr_image_url as string | undefined) ?? null;
    const instructions = String(gw.config.instructions ?? "Pay to the UPI ID above and upload the screenshot below.");
    if (!upiId) throw new Error("Manual UPI is not configured");
    return {
      orderId,
      provider: "manual_upi",
      launch: {
        kind: "manual_upi",
        upiId,
        accountName,
        qrImageUrl,
        amountPaise: input.amountPaise,
        instructions,
        orderRef: orderId,
      },
    };
  },

  verifySignature() {
    // No webhook; verification happens through admin approval.
    return true;
  },

  async health(gw) {
    return gw.config.upi_id
      ? { status: "healthy", message: "UPI ID configured" }
      : { status: "down", message: "UPI ID not set" };
  },
};
