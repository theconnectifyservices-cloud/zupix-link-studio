import { useEffect } from "react";

const RESET_PATH = "/auth/reset-password";

/**
 * A password-recovery link can land on any route: Supabase falls back to the
 * Site URL when a mail client rewrites the redirect, and some templates point
 * at `/auth/callback`. Whenever recovery artefacts are present in the URL and
 * we are not already on the reset screen, forward there with the params intact
 * so the "Reset password" button always opens the reset page.
 */
export function RecoveryLinkRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { pathname, search, hash } = window.location;
    if (pathname === RESET_PATH) return;

    const query = new URLSearchParams(search);
    const fragment = new URLSearchParams(hash.replace(/^#/, ""));
    const get = (k: string) => query.get(k) ?? fragment.get(k);

    const type = get("type");
    const isRecovery =
      type === "recovery" ||
      (get("error_code") ?? "").includes("otp_expired") ||
      (get("error_description") ?? "").toLowerCase().includes("recovery");

    if (!isRecovery) return;
    window.location.replace(`${RESET_PATH}${search}${hash}`);
  }, []);

  return null;
}
