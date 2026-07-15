import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { fetchWorkspaces, type WorkspaceRow } from "@/features/auth/api";
import { supabase } from "@/integrations/supabase/client";

/**
 * Current workspace resolution: profile.active_workspace_id → first membership.
 * Self-heals: if the signed-in user has no workspace, auto-provisions a personal one.
 */
export function useCurrentWorkspace() {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["workspaces", userId],
    queryFn: () => fetchWorkspaces(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const workspaces: WorkspaceRow[] = query.data ?? [];
  const active =
    workspaces.find((w) => w.id === profile?.active_workspace_id) ?? workspaces[0] ?? null;

  // Self-healing: if the fetch resolved and returned zero workspaces, provision one.
  const healingRef = useRef(false);
  useEffect(() => {
    if (!userId) return;
    if (query.isLoading || query.isFetching) return;
    if (workspaces.length > 0) return;
    if (healingRef.current) return;
    healingRef.current = true;
    (async () => {
      try {
        const { error } = await supabase.rpc("ensure_personal_workspace" as never);
        if (error) throw error;
        await qc.invalidateQueries({ queryKey: ["workspaces", userId] });
        await qc.invalidateQueries({ queryKey: ["profile", userId] });
      } catch (err) {
        console.error("[ensure_personal_workspace] failed", err);
      } finally {
        healingRef.current = false;
      }
    })();
  }, [userId, query.isLoading, query.isFetching, workspaces.length, qc]);

  const isProvisioning = !!userId && !query.isLoading && workspaces.length === 0;

  return {
    workspace: active,
    workspaces,
    isLoading: query.isLoading || isProvisioning,
    userId,
  };
}
