import { create } from "zustand";

type Flags = Record<string, boolean>;

interface FeatureFlagsState {
  flags: Flags;
  isEnabled: (key: string) => boolean;
  setFlags: (f: Flags) => void;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set, get) => ({
  flags: {},
  isEnabled: (key) => Boolean(get().flags[key]),
  setFlags: (flags) => set({ flags }),
}));
