import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { useUserRoles } from "@/features/auth/hooks/use-user-roles";
import type { Permission } from "@/features/auth/rbac";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/components/ui/button";

interface Props {
  permission: Permission | Permission[];
  children: ReactNode;
  /** If true, redirect to /app instead of showing Access Denied. */
  redirect?: boolean;
}

export function RequirePermission({ permission, children, redirect }: Props) {
  const { isLoading, hasAny } = useUserRoles();
  const navigate = useNavigate();
  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = hasAny(perms);

  useEffect(() => {
    if (!isLoading && !allowed && redirect) {
      navigate({ to: "/app" });
    }
  }, [isLoading, allowed, redirect, navigate]);

  if (isLoading) return <PageLoader label="Checking permissions" />;
  if (!allowed) {
    if (redirect) return <PageLoader label="Redirecting" />;
    return (
      <div className="p-8">
        <EmptyState
          icon={<ShieldAlert className="h-8 w-8" />}
          title="Access denied"
          description="You don't have permission to access this module. Contact your administrator if you believe this is a mistake."
          action={
            <Button variant="outline" onClick={() => navigate({ to: "/app" })}>
              Back to dashboard
            </Button>
          }
        />
      </div>
    );
  }
  return <>{children}</>;
}
