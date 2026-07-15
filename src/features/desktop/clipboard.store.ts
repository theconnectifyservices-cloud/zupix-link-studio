import { create } from "zustand";

export interface ClipEntry {
  id: string;
  kind: "block" | "section" | "text" | "asset";
  label: string;
  payload: unknown;
  origin?: string; // e.g. project id
  at: number;
}

interface ClipboardState {
  history: ClipEntry[];
  push: (entry: Omit<ClipEntry, "id" | "at">) => ClipEntry;
  clear: () => void;
  remove: (id: string) => void;
  latest: () => ClipEntry | null;
}

const MAX = 20;

/** Session-scoped clipboard manager (not persisted). */
export const useClipboardManager = create<ClipboardState>((set, get) => ({
  history: [],
  push: (entry) => {
    const full: ClipEntry = { ...entry, id: crypto.randomUUID(), at: Date.now() };
    set((s) => ({ history: [full, ...s.history].slice(0, MAX) }));
    return full;
  },
  clear: () => set({ history: [] }),
  remove: (id) => set((s) => ({ history: s.history.filter((e) => e.id !== id) })),
  latest: () => get().history[0] ?? null,
}));
