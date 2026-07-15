import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DownloadQuality = "auto" | "high" | "medium" | "low";

export interface MobileNotifCategories {
  activity: boolean;
  campaigns: boolean;
  system: boolean;
  team: boolean;
}

interface MobileState {
  dataSaver: boolean;
  autoSync: boolean;
  downloadQuality: DownloadQuality;
  hapticsEnabled: boolean;
  notifications: MobileNotifCategories;
  update: (patch: Partial<Omit<MobileState, "update" | "updateNotifications">>) => void;
  updateNotifications: (patch: Partial<MobileNotifCategories>) => void;
}

export const useMobileStore = create<MobileState>()(
  persist(
    (set) => ({
      dataSaver: false,
      autoSync: true,
      downloadQuality: "auto",
      hapticsEnabled: true,
      notifications: {
        activity: true,
        campaigns: true,
        system: true,
        team: true,
      },
      update: (patch) => set(patch),
      updateNotifications: (patch) =>
        set((s) => ({ notifications: { ...s.notifications, ...patch } })),
    }),
    { name: "zupix.mobile.prefs" },
  ),
);
