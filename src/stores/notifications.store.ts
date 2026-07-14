import { create } from "zustand";

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  read: boolean;
  createdAt: number;
}

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  add: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markAllRead: () => void;
  clear: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  items: [],
  unreadCount: 0,
  add: (n) =>
    set((s) => {
      const item: AppNotification = {
        ...n,
        id: crypto.randomUUID(),
        read: false,
        createdAt: Date.now(),
      };
      return { items: [item, ...s.items], unreadCount: s.unreadCount + 1 };
    }),
  markAllRead: () =>
    set((s) => ({ items: s.items.map((i) => ({ ...i, read: true })), unreadCount: 0 })),
  clear: () => set({ items: [], unreadCount: 0 }),
}));
