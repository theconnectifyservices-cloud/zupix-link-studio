/**
 * Resolves where a user lands after authenticating or after clicking
 * "Dashboard" from the public site.
 *
 * Rule: the authenticated home is always Dashboard Home (`/app`). We never
 * restore account-management screens (settings / profile / password) as an
 * entry point — those are only reachable by explicit in-app navigation.
 */
const BLOCKED_ENTRY_PREFIXES = [
  "/app/settings",
  "/app/profile",
  "/app/password",
  "/auth",
  "/onboarding",
];

export const DASHBOARD_HOME = "/app" as const;

export function resolvePostAuthTarget(redirectTo?: string | null): string {
  if (!redirectTo) return DASHBOARD_HOME;

  let path = redirectTo;
  try {
    // `location.href` is stored by the auth gate; normalise to a pathname.
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    return DASHBOARD_HOME;
  }

  // Only allow same-origin internal paths.
  if (!path.startsWith("/") || path.startsWith("//")) return DASHBOARD_HOME;
  if (BLOCKED_ENTRY_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return DASHBOARD_HOME;
  }
  return path;
}
