import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyNotifications,
  markAllNotificationsRead,
  setNotificationState,
  fetchActiveAnnouncement,
  fetchReleaseNotes,
} from "./api";
import { useSession } from "@/features/auth/hooks/use-session";

export function useMyNotifications() {
  const session = useSession();
  const authed = session.status === "authenticated";
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["comm", "feed"],
    enabled: authed,
    staleTime: 30_000,
    queryFn: fetchMyNotifications,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["comm", "feed"] });

  const markRead = useMutation({
    mutationFn: (id: string) => setNotificationState(id, { read: true }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => setNotificationState(id, { deleted: true }),
    onSuccess: invalidate,
  });
  const markPopupSeen = useMutation({
    mutationFn: (id: string) => setNotificationState(id, { popupSeen: true }),
    onSuccess: invalidate,
  });
  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  const items = q.data ?? [];
  return {
    items,
    isLoading: q.isLoading && authed,
    unreadCount: items.filter((i) => !i.read_at).length,
    markRead: (id: string) => markRead.mutate(id),
    remove: (id: string) => remove.mutate(id),
    markPopupSeen: (id: string) => markPopupSeen.mutate(id),
    markAllRead: () => markAll.mutate(),
  };
}

export function useActiveAnnouncement() {
  return useQuery({
    queryKey: ["comm", "announcement-bar"],
    staleTime: 60_000,
    queryFn: fetchActiveAnnouncement,
  });
}

export function useReleaseNotes(publishedOnly = true) {
  return useQuery({
    queryKey: ["comm", "release-notes", publishedOnly],
    staleTime: 60_000,
    queryFn: () => fetchReleaseNotes(publishedOnly),
  });
}
