import { createFileRoute } from "@tanstack/react-router";
import { CouponManager } from "@/features/trial";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({
    meta: [
      { title: "Coupons · ZUPIX Admin" },
      { name: "description", content: "Create, edit, archive, and track promotional coupons for the ZUPIX platform." },
    ],
  }),
  component: CouponsAdminPage,
});

function CouponsAdminPage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <CouponManager />
    </div>
  );
}
