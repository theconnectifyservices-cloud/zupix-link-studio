import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/shared/layouts";
import { PerformanceInstall } from "@/features/performance";
import { SecurityInstall } from "@/features/security";
import { RequirePermission } from "@/shared/auth/require-permission";
import type { Permission } from "@/features/auth/rbac";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppShell,
});

/** Route → required permission(s). Any match grants access. */
const ROUTE_GUARDS: Array<{ prefix: string; permission: Permission | Permission[] }> = [
  { prefix: "/app/agency", permission: "can_manage_agency" },
  { prefix: "/app/enterprise", permission: "can_manage_enterprise" },
  { prefix: "/app/monetization", permission: "can_manage_monetization" },
  { prefix: "/app/white-label", permission: "can_manage_whitelabel" },
  { prefix: "/app/reseller", permission: "can_manage_reseller" },
  { prefix: "/app/infrastructure", permission: "can_manage_infrastructure" },
  { prefix: "/app/performance", permission: "can_manage_performance" },
  { prefix: "/app/security", permission: "can_manage_security" },
  { prefix: "/app/qa", permission: "can_manage_qa" },
  { prefix: "/app/operations", permission: "can_manage_operations" },
  { prefix: "/app/launch", permission: "can_manage_launch" },
];

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const guard = ROUTE_GUARDS.find(
    (g) => pathname === g.prefix || pathname.startsWith(g.prefix + "/"),
  );

  const content = <Outlet />;

  return (
    <DashboardLayout>
      <PerformanceInstall />
      <SecurityInstall />
      {guard ? (
        <RequirePermission permission={guard.permission} redirect>
          {content}
        </RequirePermission>
      ) : (
        content
      )}
    </DashboardLayout>
  );
}
