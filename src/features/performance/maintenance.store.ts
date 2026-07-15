import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MaintenanceState {
  enabled: boolean;
  message: string;
  setEnabled: (v: boolean) => void;
  setMessage: (m: string) => void;
}

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set) => ({
      enabled: false,
      message: "We're performing scheduled maintenance. Back shortly.",
      setEnabled: (enabled) => set({ enabled }),
      setMessage: (message) => set({ message }),
    }),
    { name: "zupix.perf.maintenance" },
  ),
);
