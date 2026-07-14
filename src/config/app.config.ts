/**
 * Central application configuration.
 * All app-wide constants and feature flags live here.
 */
export const APP_CONFIG = {
  name: "ZUPIX Link Studio",
  shortName: "ZUPIX",
  description: "Premium enterprise bio link platform.",
  version: "0.1.0",
  supportEmail: "support@zupix.app",
  defaultLocale: "en",
  defaultTheme: "system" as "light" | "dark" | "system",
} as const;

export const ROUTES = {
  home: "/",
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
    forgot: "/auth/forgot",
  },
  app: {
    dashboard: "/app",
    editor: "/app/editor",
    analytics: "/app/analytics",
    settings: "/app/settings",
  },
  admin: {
    root: "/admin",
  },
} as const;
