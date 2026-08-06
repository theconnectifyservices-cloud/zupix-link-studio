import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/shared/layouts/admin-layout";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdmin, type PlatformRole } from "@/features/auth/rbac";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    // 1. Verify session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth" });
    }

    // 2. Verify super_admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);
    
    const userRoles = (roles || []).map(r => r.role as PlatformRole);
    if (!isSuperAdmin(userRoles)) {
      throw redirect({ to: "/app" });
    }
  },
  component: AdminRouteLayout,
});

function AdminRouteLayout() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
