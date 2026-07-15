import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ComponentType } from "react";

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  group?: string;
  icon?: ComponentType<{ className?: string }>;
  keywords?: string[];
  shortcut?: string;
  run: () => void | Promise<void>;
}

interface CommandRegistryState {
  commands: Map<string, Command>;
  register: (cmd: Command | Command[]) => () => void;
  unregister: (id: string) => void;
  list: () => Command[];
}

/** In-memory command registry (not persisted). */
export const useCommandRegistry = create<CommandRegistryState>((set, get) => ({
  commands: new Map(),
  register: (cmd) => {
    const arr = Array.isArray(cmd) ? cmd : [cmd];
    set((s) => {
      const map = new Map(s.commands);
      for (const c of arr) map.set(c.id, c);
      return { commands: map };
    });
    return () => {
      set((s) => {
        const map = new Map(s.commands);
        for (const c of arr) map.delete(c.id);
        return { commands: map };
      });
    };
  },
  unregister: (id) =>
    set((s) => {
      const map = new Map(s.commands);
      map.delete(id);
      return { commands: map };
    }),
  list: () => Array.from(get().commands.values()),
}));

interface CommandHistoryState {
  recent: string[];
  pinned: string[];
  pushRecent: (id: string) => void;
  togglePinned: (id: string) => void;
  clearRecent: () => void;
}

/** Persisted history of run/pinned commands. */
export const useCommandHistory = create<CommandHistoryState>()(
  persist(
    (set) => ({
      recent: [],
      pinned: [],
      pushRecent: (id) =>
        set((s) => ({ recent: [id, ...s.recent.filter((r) => r !== id)].slice(0, 8) })),
      togglePinned: (id) =>
        set((s) => ({
          pinned: s.pinned.includes(id) ? s.pinned.filter((p) => p !== id) : [...s.pinned, id],
        })),
      clearRecent: () => set({ recent: [] }),
    }),
    { name: "zupix.commands.history" },
  ),
);
