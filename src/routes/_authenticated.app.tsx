import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/shared/layouts";
import { PerformanceInstall } from "@/features/performance";
import { SecurityInstall } from "@/features/security";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  return (
    <DashboardLayout>
      <PerformanceInstall />
      <SecurityInstall />
      <Outlet />
    </DashboardLayout>
  );
}
