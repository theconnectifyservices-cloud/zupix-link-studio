import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/constants";

interface Preferences {
  language: string;
  density: "comfortable" | "compact";
  reduceMotion: boolean;
}

interface PreferencesState extends Preferences {
  update: (patch: Partial<Preferences>) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: "en",
      density: "comfortable",
      reduceMotion: false,
      update: (patch) => set(patch),
    }),
    { name: STORAGE_KEYS.preferences },
  ),
);
