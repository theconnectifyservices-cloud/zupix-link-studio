import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardLayout } from "@/shared/layouts";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

function AppShell() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
