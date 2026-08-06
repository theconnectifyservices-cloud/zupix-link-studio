import { createFileRoute } from "@tanstack/react-router";
import { AdminComingSoon } from "@/features/admin/components/coming-soon";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: () => <AdminComingSoon title="Admin Settings" />,
});
