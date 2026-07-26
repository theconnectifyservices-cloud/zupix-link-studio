import { createFileRoute } from "@tanstack/react-router";
import { PaymentHub } from "@/features/payments/components/admin/payment-hub";

export const Route = createFileRoute("/_authenticated/admin/payment-gateways")({
  head: () => ({
    meta: [
      { title: "Payment Gateway Hub · ZUPIX Admin" },
      { name: "description", content: "Multi-gateway payments, manual grants, offline receipts and audit logs." },
    ],
  }),
  component: () => (
    <div className="container mx-auto py-8 max-w-6xl px-4">
      <PaymentHub />
    </div>
  ),
});
