/**
 * Browser Notification API wrapper — permission manager + local history.
 * Server-side Web Push subscriptions (VAPID) are a later phase; this module
 * focuses on request/permission UX and in-app notification history.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PermissionState = "default" | "granted" | "denied" | "unsupported";

export interface NotifRecord {
  id: string;
  title: string;
  body?: string;
  category: "activity" | "campaigns" | "system" | "team";
  url?: string;
  at: number;
  read: boolean;
}

interface NotifState {
  history: NotifRecord[];
  push: (n: Omit<NotifRecord, "id" | "at" | "read">) => NotifRecord;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotifHistory = create<NotifState>()(
  persist(
    (set) => ({
      history: [],
      push: (n) => {
        const record: NotifRecord = {
          ...n,
          id: crypto.randomUUID(),
          at: Date.now(),
          read: false,
        };
        set((s) => ({ history: [record, ...s.history].slice(0, 100) }));
        return record;
      },
      markRead: (id) =>
        set((s) => ({
          history: s.history.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllRead: () =>
        set((s) => ({ history: s.history.map((n) => ({ ...n, read: true })) })),
      clear: () => set({ history: [] }),
    }),
    { name: "zupix.mobile.notif-history" },
  ),
);

export function getPermission(): PermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission as PermissionState;
  const res = await Notification.requestPermission();
  return res as PermissionState;
}

export interface ShowNotifOptions {
  title: string;
  body?: string;
  category?: NotifRecord["category"];
  url?: string;
  icon?: string;
  tag?: string;
}

export async function showNotification(opts: ShowNotifOptions) {
  const record = useNotifHistory.getState().push({
    title: opts.title,
    body: opts.body,
    category: opts.category ?? "system",
    url: opts.url,
  });
  if (getPermission() === "granted") {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.showNotification(opts.title, {
          body: opts.body,
          icon: opts.icon ?? "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: opts.tag,
          data: { url: opts.url, id: record.id },
        });
      } else {
        new Notification(opts.title, { body: opts.body, icon: opts.icon, tag: opts.tag });
      }
    } catch {
      /* ignore */
    }
  }
  return record;
}
