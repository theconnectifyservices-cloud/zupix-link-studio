import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/shared/layouts";
import { PerformanceInstall } from "@/features/performance";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  return (
    <DashboardLayout>
      <PerformanceInstall />
      <Outlet />
    </DashboardLayout>
  );
}
