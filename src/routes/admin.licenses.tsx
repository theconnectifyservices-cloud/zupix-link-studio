import { createFileRoute } from "@tanstack/react-router";
import { AdminComingSoon } from "@/features/admin/components/coming-soon";

export const Route = createFileRoute("/admin/licenses")({
  component: () => <AdminComingSoon title="License Manager" />,
});
