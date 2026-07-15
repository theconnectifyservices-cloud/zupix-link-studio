import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuditCategory =
  | "auth"
  | "permission"
  | "billing"
  | "admin"
  | "api"
  | "security";

export interface AuditEntry {
  id: string;
  category: AuditCategory;
  action: string;
  actor?: string | null;
  target?: string | null;
  metadata?: Record<string, unknown>;
  at: number;
}

const MAX_ENTRIES = 500;

interface AuditState {
  entries: AuditEntry[];
  log: (entry: Omit<AuditEntry, "id" | "at">) => void;
  clear: () => void;
}

export const useAuditLogStore = create<AuditState>()(
  persist(
    (set) => ({
      entries: [],
      log: (entry) =>
        set((s) => {
          const next: AuditEntry = {
            id: crypto.randomUUID(),
            at: Date.now(),
            ...entry,
          };
          return { entries: [next, ...s.entries].slice(0, MAX_ENTRIES) };
        }),
      clear: () => set({ entries: [] }),
    }),
    { name: "zupix:security:audit-log" },
  ),
);
