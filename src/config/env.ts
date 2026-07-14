/**
 * Typed environment access. Client-safe env goes through import.meta.env (VITE_*).
 * Server-only secrets should be read inside server function handlers via process.env.
 */
export const clientEnv = {
  appUrl: import.meta.env.VITE_APP_URL ?? "",
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
