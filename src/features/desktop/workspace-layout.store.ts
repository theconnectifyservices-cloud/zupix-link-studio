import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PanelId = "left" | "right" | "inspector" | "activity" | "preview";

export type ProductivityMode = "normal" | "focus" | "compact" | "dense";

interface WorkspaceLayoutState {
  panels: Record<PanelId, boolean>;
  sizes: Record<string, number[]>;
  mode: ProductivityMode;
  fullscreen: boolean;
  togglePanel: (id: PanelId) => void;
  setPanel: (id: PanelId, open: boolean) => void;
  saveSizes: (id: string, sizes: number[]) => void;
  setMode: (m: ProductivityMode) => void;
  toggleFocus: () => void;
  setFullscreen: (v: boolean) => void;
  reset: () => void;
}

const DEFAULT_PANELS: Record<PanelId, boolean> = {
  left: true,
  right: true,
  inspector: false,
  activity: false,
  preview: true,
};

export const useWorkspaceLayout = create<WorkspaceLayoutState>()(
  persist(
    (set) => ({
      panels: DEFAULT_PANELS,
      sizes: {},
      mode: "normal",
      fullscreen: false,
      togglePanel: (id) =>
        set((s) => ({ panels: { ...s.panels, [id]: !s.panels[id] } })),
      setPanel: (id, open) => set((s) => ({ panels: { ...s.panels, [id]: open } })),
      saveSizes: (id, sizes) => set((s) => ({ sizes: { ...s.sizes, [id]: sizes } })),
      setMode: (mode) => set({ mode }),
      toggleFocus: () =>
        set((s) => ({ mode: s.mode === "focus" ? "normal" : "focus" })),
      setFullscreen: (fullscreen) => set({ fullscreen }),
      reset: () => set({ panels: DEFAULT_PANELS, sizes: {}, mode: "normal" }),
    }),
    { name: "zupix.desktop.layout" },
  ),
);
