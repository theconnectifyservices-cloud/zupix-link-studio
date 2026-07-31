import { supabase } from "@/integrations/supabase/client";

export type LinkResult =
  | { status: "session" }
  | { status: "none" }
  | { status: "error"; message: string };

function friendlyLinkError(raw?: string | null): string {
  const m = (raw ?? "").toLowerCase();
  if (m.includes("expired") || m.includes("otp_expired")) {
    return "This link has expired. Request a new one below.";
  }
  if (m.includes("code verifier") || m.includes("invalid request")) {
    return "This link must be opened in the same browser that requested it. Request a new link and open it here.";
  }
  if (m.includes("already") || m.includes("used")) {
    return "This link has already been used. Request a new one below.";
  }
  return raw && raw.length > 0 ? raw : "This link is invalid. Request a new one below.";
}

function stripAuthParamsFromUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  ["code", "token_hash", "type", "error", "error_code", "error_description"].forEach((k) =>
    url.searchParams.delete(k),
  );
  url.hash = "";
  window.history.replaceState({}, "", url.pathname + url.search);
}

/**
 * Consume whatever auth artefact is present in the current URL:
 *  - PKCE `?code=`
 *  - Email OTP `?token_hash=&type=`
 *  - Implicit `#access_token=&refresh_token=`
 * Falls back to an already-persisted session.
 */
export async function consumeAuthLink(): Promise<LinkResult> {
  if (typeof window === "undefined") return { status: "none" };

  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const get = (key: string) => url.searchParams.get(key) ?? hash.get(key) ?? undefined;

  const errorDescription = get("error_description") ?? get("error");
  if (errorDescription) {
    stripAuthParamsFromUrl();
    return { status: "error", message: friendlyLinkError(errorDescription) };
  }

  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    stripAuthParamsFromUrl();
    if (error) return { status: "error", message: friendlyLinkError(error.message) };
    return { status: "session" };
  }

  const tokenHash = get("token_hash");
  const rawType = get("type");
  if (tokenHash) {
    const type = (rawType ?? "recovery") as "recovery" | "email" | "signup" | "magiclink" | "invite";
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    stripAuthParamsFromUrl();
    if (error) return { status: "error", message: friendlyLinkError(error.message) };
    return { status: "session" };
  }

  const code = get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    stripAuthParamsFromUrl();
    if (error) {
      // detectSessionInUrl may already have consumed the code successfully.
      const { data } = await supabase.auth.getSession();
      if (data.session) return { status: "session" };
      return { status: "error", message: friendlyLinkError(error.message) };
    }
    return { status: "session" };
  }

  const { data } = await supabase.auth.getSession();
  return data.session ? { status: "session" } : { status: "none" };
}
