import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/features/auth/hooks/use-session";
import {
  adminDeleteVersion,
  adminFetchAnalytics,
  adminFetchSkipOverview,
  adminListVersions,
  adminSaveVersion,
  adminSetVersionStatus,
  fetchMyUpdateHistory,
  fetchMyVersions,
  setUpdateState,
  type UpdateStatePatch,
  type VersionDraft,
} from "./api";
import type { MyVersion, PlatformVersion } from "./types";

const FEED_KEY = ["platform-updates", "mine"];
const ADMIN_KEY = ["platform-updates", "admin"];

/** "Remind me later" hides an update for this long. */
const REMIND_LATER_MS = 24 * 60 * 60 * 1000;

/* --------------------------------- user --------------------------------- */

export function useMyVersions() {
  const session = useSession();
  const authed = session.status === "authenticated";
  return useQuery({
    queryKey: FEED_KEY,
    enabled: authed,
    staleTime: 60_000,
    queryFn: fetchMyVersions,
  });
}

export function useUpdateStateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateStatePatch }) =>
      setUpdateState(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: FEED_KEY }),
  });
}

/**
 * The single update that should surface in the modal, or null.
 * Skips anything already acted on, permanently silenced, or snoozed
 * within the last 24 hours.
 */
export function useLatestUpdate(): { update: MyVersion | null; isLoading: boolean } {
  const { data, isLoading } = useMyVersions();

  const update = useMemo(() => {
    const items = data ?? [];
    const eligible = items.filter((v) => {
      if (v.never_show_at) return false;
      // "Skip this version" only silences THIS version — future releases still show.
      if (v.skipped_at) return false;
      if (v.updated_at_action) return false;
      if (v.dismissed_at && Date.now() - new Date(v.dismissed_at).getTime() < REMIND_LATER_MS) {
        return false;
      }
      return true;
    });
    if (eligible.length === 0) return null;
    // Forced and critical releases jump the queue, then newest wins.
    const rank = (v: MyVersion) => (v.is_forced ? 2 : v.priority === "critical" ? 1 : 0);
    return [...eligible].sort(
      (a, b) => rank(b) - rank(a) || b.version_sort - a.version_sort,
    )[0];
  }, [data]);

  return { update, isLoading };
}

/** Versions the user chose to skip, newest first. */
export function useSkippedVersions() {
  const { data, isLoading } = useMyVersions();
  const skipped = useMemo(
    () =>
      (data ?? [])
        .filter((v) => !!v.skipped_at)
        .sort((a, b) => b.version_sort - a.version_sort),
    [data],
  );
  return { skipped, isLoading };
}

export function useSkipOverview() {
  return useQuery({
    queryKey: ["platform-updates", "skip-overview"],
    staleTime: 30_000,
    queryFn: adminFetchSkipOverview,
  });
}

export function useUpdateHistory() {
  const session = useSession();
  return useQuery({
    queryKey: ["platform-updates", "history"],
    enabled: session.status === "authenticated",
    staleTime: 60_000,
    queryFn: () => fetchMyUpdateHistory(),
  });
}

/* --------------------------------- admin -------------------------------- */

export function useAdminVersions() {
  return useQuery({ queryKey: ADMIN_KEY, staleTime: 30_000, queryFn: adminListVersions });
}

export function useVersionMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ADMIN_KEY });
    qc.invalidateQueries({ queryKey: FEED_KEY });
  };

  const save = useMutation({
    mutationFn: (draft: VersionDraft) => adminSaveVersion(draft),
    onSuccess: (v) => {
      invalidate();
      toast.success(`Version ${v.version} saved`);
    },
    onError: (e: Error) => toast.error(e.message || "Could not save this version"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteVersion(id),
    onSuccess: () => {
      invalidate();
      toast.success("Version deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete this version"),
  });

  const setStatus = useMutation({
    mutationFn: ({
      id,
      status,
      publishAt,
    }: {
      id: string;
      status: PlatformVersion["status"];
      publishAt?: string | null;
    }) => adminSetVersionStatus(id, status, publishAt),
    onSuccess: (_d, vars) => {
      invalidate();
      const msg: Record<string, string> = {
        published: "Update published to targeted users",
        scheduled: "Update scheduled",
        draft: "Moved back to draft",
        archived: "Update archived",
      };
      toast.success(msg[vars.status] ?? "Status updated");
    },
    onError: (e: Error) => toast.error(e.message || "Could not change status"),
  });

  return { save, remove, setStatus };
}

export function useVersionAnalytics(versionId: string | null) {
  return useQuery({
    queryKey: ["platform-updates", "analytics", versionId],
    enabled: !!versionId,
    staleTime: 30_000,
    queryFn: () => adminFetchAnalytics(versionId!),
  });
}
