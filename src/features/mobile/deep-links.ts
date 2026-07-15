/**
 * Canonical deep-link builders. Uses TanStack Router paths so links resolve
 * on published, preview, and installed-PWA contexts alike.
 */
export const deepLinks = {
  dashboard: () => "/app",
  builder: (pageId: string) => `/app/builder/${encodeURIComponent(pageId)}`,
  analytics: () => "/app/analytics",
  settings: () => "/app/settings",
  mobileSettings: () => "/app/settings/mobile",
  bioPage: (slug: string) => `/${encodeURIComponent(slug)}`,
  bioSubpage: (slug: string, page: string) =>
    `/${encodeURIComponent(slug)}/${encodeURIComponent(page)}`,
  invite: (token: string) => `/invite/${encodeURIComponent(token)}`,
};

export function absoluteUrl(path: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return path;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
