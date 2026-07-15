import { create } from "zustand";

export interface RequestSample {
  id: string;
  url: string;
  method: string;
  status: number;
  durationMs: number;
  ts: number;
  ok: boolean;
}

interface ObservabilityState {
  requests: RequestSample[];
  events: { id: string; ts: number; type: string; message: string }[];
  record: (r: Omit<RequestSample, "id" | "ts">) => void;
  emit: (type: string, message: string) => void;
  clear: () => void;
}

const MAX_REQ = 300;
const MAX_EV = 100;

export const useObservabilityStore = create<ObservabilityState>((set) => ({
  requests: [],
  events: [],
  record: (r) =>
    set((state) => ({
      requests: [{ ...r, id: crypto.randomUUID(), ts: Date.now() }, ...state.requests].slice(0, MAX_REQ),
    })),
  emit: (type, message) =>
    set((state) => ({
      events: [{ id: crypto.randomUUID(), ts: Date.now(), type, message }, ...state.events].slice(0, MAX_EV),
    })),
  clear: () => set({ requests: [], events: [] }),
}));

let installed = false;
/** Patches fetch to record request timing + status. Safe in browser only. */
export function installFetchObserver() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const orig = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const start = performance.now();
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")) ?? "GET";
    try {
      const res = await orig(input, init);
      useObservabilityStore.getState().record({
        url,
        method,
        status: res.status,
        durationMs: performance.now() - start,
        ok: res.ok,
      });
      return res;
    } catch (err) {
      useObservabilityStore.getState().record({
        url,
        method,
        status: 0,
        durationMs: performance.now() - start,
        ok: false,
      });
      throw err;
    }
  };
}

export function observabilitySummary() {
  const { requests } = useObservabilityStore.getState();
  const total = requests.length;
  if (!total) return { total: 0, errorRate: 0, p50: 0, p95: 0, avg: 0 };
  const durations = [...requests.map((r) => r.durationMs)].sort((a, b) => a - b);
  const errors = requests.filter((r) => !r.ok).length;
  const p = (q: number) => durations[Math.min(durations.length - 1, Math.floor(q * durations.length))];
  const avg = durations.reduce((a, b) => a + b, 0) / total;
  return { total, errorRate: errors / total, p50: p(0.5), p95: p(0.95), avg };
}
