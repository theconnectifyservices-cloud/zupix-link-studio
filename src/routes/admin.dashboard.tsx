import { createFileRoute } from "@tanstack/react-router";
import { AdminComingSoon } from "@/features/admin/components/coming-soon";

export const Route = createFileRoute("/dashboard")({
  component: () => <AdminComingSoon title="Admin Dashboard" />,
});
