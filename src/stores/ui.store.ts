import { create } from "zustand";

interface UIState {
  globalLoading: boolean;
  commandPaletteOpen: boolean;
  sidebarOpen: boolean;
  setGlobalLoading: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  globalLoading: false,
  commandPaletteOpen: false,
  sidebarOpen: true,
  setGlobalLoading: (globalLoading) => set({ globalLoading }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
