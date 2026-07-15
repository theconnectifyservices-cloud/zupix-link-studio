import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useSession } from "@/features/auth/hooks/use-session";
import { listCustomRoles, listMembers, listRoleOverrides } from "./api";
import type { WorkspaceMemberRecord, CustomRoleRecord, RolePermissionOverride } from "./api";
import { ROLE_DEFAULTS, type WorkspaceRole } from "./permissions";

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ws-members", workspaceId],
    queryFn: () => listMembers(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useCustomRoles(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ws-custom-roles", workspaceId],
    queryFn: () => listCustomRoles(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useRoleOverrides(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ws-role-overrides", workspaceId],
    queryFn: () => listRoleOverrides(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

/**
 * Resolve the current user's effective permissions in the given workspace.
 * Pure client-side derivation — the server is the source of truth.
 */
export function usePermissions(workspaceId: string | undefined) {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: members = [] } = useMembers(workspaceId);
  const { data: customRoles = [] } = useCustomRoles(workspaceId);
  const { data: overrides = [] } = useRoleOverrides(workspaceId);

  return useMemo(() => {
    const me = members.find((m: WorkspaceMemberRecord) => m.user_id === userId);
    if (!me || me.status !== "active") {
      return { permissions: new Set<string>(), role: null as WorkspaceRole | null, customRoleKey: null as string | null, has: () => false };
    }
    const roleKey = me.custom_role_key ?? me.role;
    const custom = me.custom_role_key
      ? customRoles.find((r: CustomRoleRecord) => r.key === me.custom_role_key)
      : null;
    const base: string[] = custom?.permissions?.length ? custom.permissions : ROLE_DEFAULTS[me.role] ?? [];
    const set = new Set<string>(base);
    for (const o of overrides as RolePermissionOverride[]) {
      if (o.role_key !== roleKey) continue;
      if (o.granted) set.add(o.permission_key);
      else set.delete(o.permission_key);
    }
    return {
      permissions: set,
      role: me.role,
      customRoleKey: me.custom_role_key,
      has: (k: string) => set.has(k),
    };
  }, [members, customRoles, overrides, userId]);
}
