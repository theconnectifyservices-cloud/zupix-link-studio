import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { fetchWorkspaces, type WorkspaceRow } from "@/features/auth/api";

/**
 * Current workspace resolution: profile.active_workspace_id → first membership.
 * Returns the row and the full list.
 */
export function useCurrentWorkspace() {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);

  const query = useQuery({
    queryKey: ["workspaces", userId],
    queryFn: () => fetchWorkspaces(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const workspaces: WorkspaceRow[] = query.data ?? [];
  const active =
    workspaces.find((w) => w.id === profile?.active_workspace_id) ?? workspaces[0] ?? null;

  return { workspace: active, workspaces, isLoading: query.isLoading, userId };
}
