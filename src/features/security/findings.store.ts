import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type FindingStatus = "open" | "resolved" | "ignored";

export interface Finding {
  id: string;
  category:
    | "http"
    | "auth"
    | "rbac"
    | "input"
    | "file"
    | "api"
    | "secrets"
    | "audit"
    | "pentest";
  title: string;
  severity: Severity;
  status: FindingStatus;
  description: string;
  recommendation: string;
  detectedAt: number;
}

interface FindingsState {
  findings: Finding[];
  setAll: (list: Finding[]) => void;
  resolve: (id: string) => void;
  ignore: (id: string) => void;
  reopen: (id: string) => void;
}

export const useFindingsStore = create<FindingsState>()(
  persist(
    (set) => ({
      findings: [],
      setAll: (list) =>
        set((s) => {
          // Preserve status of existing findings by id
          const prev = new Map(s.findings.map((f) => [f.id, f]));
          return {
            findings: list.map((f) => {
              const existing = prev.get(f.id);
              return existing ? { ...f, status: existing.status } : f;
            }),
          };
        }),
      resolve: (id) =>
        set((s) => ({
          findings: s.findings.map((f) => (f.id === id ? { ...f, status: "resolved" } : f)),
        })),
      ignore: (id) =>
        set((s) => ({
          findings: s.findings.map((f) => (f.id === id ? { ...f, status: "ignored" } : f)),
        })),
      reopen: (id) =>
        set((s) => ({
          findings: s.findings.map((f) => (f.id === id ? { ...f, status: "open" } : f)),
        })),
    }),
    { name: "zupix:security:findings" },
  ),
);
