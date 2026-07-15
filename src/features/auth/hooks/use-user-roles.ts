import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { permissionsFor, type PlatformRole, type Permission } from "../rbac";
import { useSession } from "./use-session";

export interface UserRoleState {
  isLoading: boolean;
  roles: PlatformRole[];
  permissions: Set<Permission>;
  has: (p: Permission) => boolean;
  hasAny: (p: Permission[]) => boolean;
  isSuperAdmin: boolean;
}

export function useUserRoles(): UserRoleState {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;

  const q = useQuery({
    queryKey: ["user-roles", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<PlatformRole[]> => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) {
        console.error("[useUserRoles] failed to load", error);
        return [];
      }
      return (data ?? []).map((r) => r.role as PlatformRole);
    },
  });

  const isLoading = session.status === "loading" || (!!userId && q.isLoading);
  const roles = q.data ?? [];
  const permissions = permissionsFor(roles);

  return {
    isLoading,
    roles,
    permissions,
    has: (p) => permissions.has(p),
    hasAny: (list) => list.some((p) => permissions.has(p)),
    isSuperAdmin: roles.includes("super_admin"),
  };
}
