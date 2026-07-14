export * from "./breakpoints";

export const STORAGE_KEYS = {
  theme: "zupix.theme",
  auth: "zupix.auth",
  workspace: "zupix.workspace",
  preferences: "zupix.preferences",
} as const;

export const QUERY_KEYS = {
  me: ["me"] as const,
  workspace: (id: string) => ["workspace", id] as const,
  notifications: ["notifications"] as const,
};
