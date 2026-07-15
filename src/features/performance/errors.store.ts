import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CrashEntry {
  id: string;
  message: string;
  stack?: string;
  source: "window" | "promise" | "boundary" | "manual";
  url: string;
  userAgent: string;
  ts: number;
}

interface ErrorsState {
  entries: CrashEntry[];
  log: (e: Omit<CrashEntry, "id" | "ts" | "url" | "userAgent"> & { ts?: number }) => void;
  clear: () => void;
}

const MAX = 100;

export const useErrorsStore = create<ErrorsState>()(
  persist(
    (set) => ({
      entries: [],
      log: (e) =>
        set((state) => {
          const entry: CrashEntry = {
            id: crypto.randomUUID(),
            ts: e.ts ?? Date.now(),
            url: typeof window !== "undefined" ? window.location.href : "",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            message: e.message,
            stack: e.stack,
            source: e.source,
          };
          return { entries: [entry, ...state.entries].slice(0, MAX) };
        }),
      clear: () => set({ entries: [] }),
    }),
    { name: "zupix.perf.errors" },
  ),
);

let installed = false;
export function installErrorListeners() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("error", (ev) => {
    useErrorsStore.getState().log({
      message: ev.message || "Unknown error",
      stack: ev.error?.stack,
      source: "window",
    });
  });
  window.addEventListener("unhandledrejection", (ev) => {
    const reason = ev.reason;
    useErrorsStore.getState().log({
      message: typeof reason === "string" ? reason : reason?.message || "Unhandled rejection",
      stack: reason?.stack,
      source: "promise",
    });
  });
}
