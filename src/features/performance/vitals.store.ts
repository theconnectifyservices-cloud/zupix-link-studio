import { create } from "zustand";

export type VitalName = "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
export type Rating = "good" | "needs-improvement" | "poor";

export interface VitalSample {
  name: VitalName;
  value: number;
  rating: Rating;
  ts: number;
}

interface VitalsState {
  samples: VitalSample[];
  latest: Partial<Record<VitalName, VitalSample>>;
  record: (s: VitalSample) => void;
  clear: () => void;
}

const MAX_SAMPLES = 200;

export const useVitalsStore = create<VitalsState>((set) => ({
  samples: [],
  latest: {},
  record: (s) =>
    set((state) => {
      const samples = [...state.samples, s].slice(-MAX_SAMPLES);
      return { samples, latest: { ...state.latest, [s.name]: s } };
    }),
  clear: () => set({ samples: [], latest: {} }),
}));

export const VITAL_THRESHOLDS: Record<VitalName, { good: number; poor: number; unit: string }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 0.1, poor: 0.25, unit: "" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
};

export function formatVital(name: VitalName, value: number): string {
  const t = VITAL_THRESHOLDS[name];
  if (t.unit === "ms") return `${Math.round(value)} ms`;
  return value.toFixed(3);
}
