import { createFileRoute } from "@tanstack/react-router";
import { SystemHealthDashboard } from "@/features/admin/components/system-health";

export const Route = createFileRoute("/admin/monitoring")({
  component: SystemHealthDashboard,
});
