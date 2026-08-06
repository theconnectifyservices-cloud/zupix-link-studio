import { createFileRoute } from "@tanstack/react-router";
import { AdminComingSoon } from "@/features/admin/components/coming-soon";

export const Route = createFileRoute("/admin/updates")({
  component: () => <AdminComingSoon title="App Update Center" />,
});
