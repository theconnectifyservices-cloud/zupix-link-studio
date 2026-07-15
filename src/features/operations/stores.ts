import { create } from "zustand";
import { persist } from "zustand/middleware";

/* -------- Environments -------- */
export type EnvKey = "development" | "staging" | "production";
export interface EnvConfig {
  key: EnvKey;
  label: string;
  baseUrl: string;
  region: string;
  notes: string;
  readonly: boolean;
}
interface EnvState {
  active: EnvKey;
  environments: Record<EnvKey, EnvConfig>;
  setActive: (k: EnvKey) => void;
}
export const useEnvStore = create<EnvState>()(
  persist(
    (set) => ({
      active: "development",
      environments: {
        development: { key: "development", label: "Development", baseUrl: "http://localhost:8080", region: "local", notes: "Local build & hot reload.", readonly: false },
        staging: { key: "staging", label: "Staging", baseUrl: "https://staging.zupix.app", region: "edge", notes: "Pre-production mirror.", readonly: false },
        production: { key: "production", label: "Production", baseUrl: "https://app.zupix.link", region: "edge", notes: "Live customer traffic.", readonly: true },
      },
      setActive: (active) => set({ active }),
    }),
    { name: "zupix.ops.env" },
  ),
);

/* -------- Alerts -------- */
export type AlertSev = "info" | "warning" | "critical";
export type AlertChannel = "email" | "slack" | "webhook" | "in-app";
export interface OpsAlert {
  id: string;
  ts: number;
  severity: AlertSev;
  channel: AlertChannel;
  title: string;
  message: string;
  acknowledged: boolean;
  ackBy?: string;
  ackAt?: number;
}
interface AlertsState {
  alerts: OpsAlert[];
  channels: Record<AlertChannel, boolean>;
  raise: (a: Omit<OpsAlert, "id" | "ts" | "acknowledged">) => void;
  ack: (id: string, who?: string) => void;
  clearResolved: () => void;
  toggleChannel: (c: AlertChannel, on: boolean) => void;
}
export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      channels: { email: true, slack: false, webhook: false, "in-app": true },
      raise: (a) =>
        set((s) => ({
          alerts: [
            { ...a, id: crypto.randomUUID(), ts: Date.now(), acknowledged: false },
            ...s.alerts,
          ].slice(0, 200),
        })),
      ack: (id, who) =>
        set((s) => ({
          alerts: s.alerts.map((x) =>
            x.id === id ? { ...x, acknowledged: true, ackBy: who ?? "operator", ackAt: Date.now() } : x,
          ),
        })),
      clearResolved: () => set((s) => ({ alerts: s.alerts.filter((a) => !a.acknowledged) })),
      toggleChannel: (c, on) => set((s) => ({ channels: { ...s.channels, [c]: on } })),
    }),
    { name: "zupix.ops.alerts" },
  ),
);

/* -------- Backups -------- */
export type BackupKind = "database" | "assets" | "configuration";
export type BackupStatus = "success" | "failed" | "running";
export interface BackupRecord {
  id: string;
  kind: BackupKind;
  status: BackupStatus;
  sizeMb: number;
  durationSec: number;
  verified: boolean;
  ts: number;
  notes?: string;
}
interface BackupsState {
  history: BackupRecord[];
  retentionDays: number;
  setRetention: (d: number) => void;
  run: (kind: BackupKind) => void;
  verify: (id: string) => void;
}
function rndSize(k: BackupKind) {
  return k === "database" ? 120 + Math.random() * 80 : k === "assets" ? 500 + Math.random() * 800 : 2 + Math.random() * 4;
}
export const useBackupsStore = create<BackupsState>()(
  persist(
    (set) => ({
      history: [],
      retentionDays: 30,
      setRetention: (retentionDays) => set({ retentionDays }),
      run: (kind: BackupKind) =>
        set((s) => ({
          history: [
            {
              id: crypto.randomUUID(),
              kind,
              status: "success" as BackupStatus,
              sizeMb: Math.round(rndSize(kind)),
              durationSec: Math.round(5 + Math.random() * 40),
              verified: false,
              ts: Date.now(),
            },
            ...s.history,
          ].slice(0, 100),
        })),
      verify: (id) =>
        set((s) => ({
          history: s.history.map((h) => (h.id === id ? { ...h, verified: true } : h)),
        })),
    }),
    { name: "zupix.ops.backups" },
  ),
);

/* -------- Incidents -------- */
export type IncidentStatus = "open" | "investigating" | "mitigated" | "resolved";
export interface IncidentEvent {
  ts: number;
  message: string;
}
export interface Incident {
  id: string;
  title: string;
  severity: AlertSev;
  status: IncidentStatus;
  owner: string;
  createdAt: number;
  updatedAt: number;
  rootCause?: string;
  resolution?: string;
  postmortem?: string;
  timeline: IncidentEvent[];
}
interface IncidentsState {
  incidents: Incident[];
  create: (i: Pick<Incident, "title" | "severity" | "owner">) => string;
  update: (id: string, patch: Partial<Incident>) => void;
  append: (id: string, message: string) => void;
}
export const useIncidentsStore = create<IncidentsState>()(
  persist(
    (set) => ({
      incidents: [],
      create: (i) => {
        const id = crypto.randomUUID();
        set((s) => ({
          incidents: [
            {
              id,
              title: i.title,
              severity: i.severity,
              owner: i.owner,
              status: "open",
              createdAt: Date.now(),
              updatedAt: Date.now(),
              timeline: [{ ts: Date.now(), message: "Incident opened" }],
            },
            ...s.incidents,
          ],
        }));
        return id;
      },
      update: (id, patch) =>
        set((s) => ({
          incidents: s.incidents.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x,
          ),
        })),
      append: (id, message) =>
        set((s) => ({
          incidents: s.incidents.map((x) =>
            x.id === id
              ? { ...x, updatedAt: Date.now(), timeline: [...x.timeline, { ts: Date.now(), message }] }
              : x,
          ),
        })),
    }),
    { name: "zupix.ops.incidents" },
  ),
);

/* -------- Restore Tests -------- */
export interface RestoreTest {
  id: string;
  backupId: string;
  kind: BackupKind;
  ts: number;
  passed: boolean;
  durationSec: number;
  integrityScore: number; // 0-100
  report: string;
}
interface RestoreState {
  tests: RestoreTest[];
  run: (backup: BackupRecord) => void;
}
export const useRestoreStore = create<RestoreState>()(
  persist(
    (set) => ({
      tests: [],
      run: (backup) =>
        set((s) => {
          const integrityScore = Math.round(90 + Math.random() * 10);
          const passed = integrityScore >= 92;
          return {
            tests: [
              {
                id: crypto.randomUUID(),
                backupId: backup.id,
                kind: backup.kind,
                ts: Date.now(),
                passed,
                durationSec: Math.round(10 + Math.random() * 60),
                integrityScore,
                report: passed
                  ? "Checksum, row counts, and sampled reads verified."
                  : "Integrity variance beyond threshold — re-run recommended.",
              },
              ...s.tests,
            ].slice(0, 50),
          };
        }),
    }),
    { name: "zupix.ops.restore" },
  ),
);

/* -------- Deployment / System log -------- */
export type LogKind = "system" | "application" | "security" | "deployment" | "infrastructure";
export interface LogEntry {
  id: string;
  ts: number;
  kind: LogKind;
  level: "info" | "warn" | "error";
  message: string;
}
interface LogState {
  entries: LogEntry[];
  append: (e: Omit<LogEntry, "id" | "ts">) => void;
  clear: () => void;
}
export const useOpsLogStore = create<LogState>()(
  persist(
    (set) => ({
      entries: [],
      append: (e) =>
        set((s) => ({
          entries: [{ ...e, id: crypto.randomUUID(), ts: Date.now() }, ...s.entries].slice(0, 300),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: "zupix.ops.logs" },
  ),
);

/* -------- Disaster Recovery plan -------- */
export interface DrChecklistItem {
  id: string;
  label: string;
  done: boolean;
}
interface DrState {
  rpoMinutes: number;
  rtoMinutes: number;
  plan: string;
  checklist: DrChecklistItem[];
  setObjectives: (rpo: number, rto: number) => void;
  setPlan: (p: string) => void;
  toggle: (id: string) => void;
}
export const useDrStore = create<DrState>()(
  persist(
    (set) => ({
      rpoMinutes: 15,
      rtoMinutes: 60,
      plan:
        "1) Detect and page on-call. 2) Contain blast radius. 3) Restore latest verified backup to standby. 4) Cutover DNS. 5) Validate flows. 6) Postmortem within 5 business days.",
      checklist: [
        { id: "1", label: "On-call rota published", done: true },
        { id: "2", label: "Backups verified within 24h", done: true },
        { id: "3", label: "Standby environment reachable", done: false },
        { id: "4", label: "Runbook links current", done: true },
        { id: "5", label: "Postmortem template available", done: true },
      ],
      setObjectives: (rpoMinutes, rtoMinutes) => set({ rpoMinutes, rtoMinutes }),
      setPlan: (plan) => set({ plan }),
      toggle: (id) =>
        set((s) => ({
          checklist: s.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
        })),
    }),
    { name: "zupix.ops.dr" },
  ),
);
