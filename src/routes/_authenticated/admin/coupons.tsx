import { createFileRoute } from "@tanstack/react-router";
import { CouponManager } from "@/features/trial";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: CouponsAdminPage,
});

function CouponsAdminPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <CouponManager />
    </div>
  );
}
