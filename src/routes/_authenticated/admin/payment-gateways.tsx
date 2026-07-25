import { createFileRoute } from "@tanstack/react-router";
import { GatewayManager } from "@/features/payments/components/admin/gateway-manager";

export const Route = createFileRoute("/_authenticated/admin/payment-gateways")({
  head: () => ({
    meta: [
      { title: "Payment Gateways · ZUPIX Admin" },
      { name: "description", content: "Manage Razorpay, PayU, Cashfree and UPI gateways." },
    ],
  }),
  component: () => (
    <div className="container mx-auto py-8 max-w-5xl">
      <GatewayManager workspaceId={null} />
    </div>
  ),
});
