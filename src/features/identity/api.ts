import { supabase } from "@/integrations/supabase/client";
import type { OAuthProviderId } from "./providers";

export interface ConnectedAccount {
  id: string;
  provider: string;
  provider_account_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  scopes: string[];
  status: string;
  connected_at: string;
  last_used_at: string | null;
}

export interface LoginHistoryRow {
  id: string;
  provider: string;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  location: Record<string, unknown> | null;
  created_at: string;
}

export interface ConnectedApp {
  id: string;
  app_name: string;
  app_slug: string;
  app_icon_url: string | null;
  permissions: string[];
  status: string;
  connected_at: string;
  last_activity_at: string | null;
  revoked_at: string | null;
}

export interface UserDeviceRow {
  id: string;
  name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  trusted: boolean;
  last_seen_at: string | null;
  created_at: string;
}

export interface UserSessionRow {
  id: string;
  device_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location: Record<string, unknown> | null;
  last_active_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/* ---------- Identities (from Supabase auth) ---------- */

export async function listAuthIdentities() {
  const { data, error } = await supabase.auth.getUserIdentities();
  if (error) throw error;
  return data?.identities ?? [];
}

export async function linkProvider(provider: OAuthProviderId, scopes?: string) {
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: `${window.location.origin}/app/settings/identity`,
      scopes,
    },
  });
  if (error) throw error;
  return data;
}

export async function unlinkProvider(identityId: string) {
  const { data: userData } = await supabase.auth.getUserIdentities();
  const identity = userData?.identities?.find((i) => i.identity_id === identityId);
  if (!identity) throw new Error("Identity not found");
  const { error } = await supabase.auth.unlinkIdentity(identity);
  if (error) throw error;
}

/* ---------- Connected accounts mirror ---------- */

export async function fetchConnectedAccounts(userId: string): Promise<ConnectedAccount[]> {
  const { data, error } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConnectedAccount[];
}

export async function syncConnectedAccountsFromAuth(userId: string) {
  const identities = await listAuthIdentities();
  const rows = identities.map((i) => ({
    user_id: userId,
    provider: i.provider,
    provider_account_id: i.id ?? i.identity_id,
    email: (i.identity_data?.email as string) ?? null,
    display_name:
      (i.identity_data?.full_name as string) ??
      (i.identity_data?.name as string) ??
      null,
    avatar_url: (i.identity_data?.avatar_url as string) ?? null,
    status: "active",
    connected_at: i.created_at ?? new Date().toISOString(),
    last_used_at: i.last_sign_in_at ?? null,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("connected_accounts")
    .upsert(rows, { onConflict: "provider,provider_account_id" });
  if (error) throw error;
}

/* ---------- Login history ---------- */

export async function fetchLoginHistory(userId: string, limit = 50): Promise<LoginHistoryRow[]> {
  const { data, error } = await supabase
    .from("login_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as LoginHistoryRow[];
}

export async function recordLogin(input: {
  userId: string;
  provider: string;
  success: boolean;
  failureReason?: string;
}) {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = /Firefox/i.test(ua)
    ? "Firefox"
    : /Edg/i.test(ua)
      ? "Edge"
      : /Chrome/i.test(ua)
        ? "Chrome"
        : /Safari/i.test(ua)
          ? "Safari"
          : "Unknown";
  const os = /Windows/i.test(ua)
    ? "Windows"
    : /Mac OS/i.test(ua)
      ? "macOS"
      : /Android/i.test(ua)
        ? "Android"
        : /iPhone|iPad|iPod/i.test(ua)
          ? "iOS"
          : /Linux/i.test(ua)
            ? "Linux"
            : "Unknown";
  const deviceType = /Mobile|Android|iPhone/i.test(ua) ? "mobile" : "desktop";
  await supabase.from("login_history").insert({
    user_id: input.userId,
    provider: input.provider,
    success: input.success,
    failure_reason: input.failureReason ?? null,
    user_agent: ua,
    browser,
    os,
    device_type: deviceType,
  });
}

/* ---------- Connected apps ---------- */

export async function fetchConnectedApps(userId: string): Promise<ConnectedApp[]> {
  const { data, error } = await supabase
    .from("connected_apps")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("connected_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ConnectedApp[];
}

export async function revokeConnectedApp(id: string) {
  const { error } = await supabase
    .from("connected_apps")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/* ---------- Devices ---------- */

export async function fetchDevices(userId: string): Promise<UserDeviceRow[]> {
  const { data, error } = await supabase
    .from("user_devices")
    .select("*")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as UserDeviceRow[];
}

export async function updateDevice(
  id: string,
  updates: Partial<Pick<UserDeviceRow, "name" | "trusted">>,
) {
  const { error } = await supabase.from("user_devices").update(updates).eq("id", id);
  if (error) throw error;
}

export async function removeDevice(id: string) {
  const { error } = await supabase.from("user_devices").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- Sessions ---------- */

export async function fetchSessions(userId: string): Promise<UserSessionRow[]> {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as UserSessionRow[];
}

export async function terminateSession(id: string) {
  const { error } = await supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function terminateAllOtherSessions(userId: string, keepId?: string) {
  let query = supabase
    .from("user_sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (keepId) query = query.neq("id", keepId);
  const { error } = await query;
  if (error) throw error;
  await supabase.auth.signOut({ scope: "others" });
}

/* ---------- Security & recovery ---------- */

export async function updateSecuritySettings(
  userId: string,
  updates: {
    recovery_email?: string | null;
    recovery_phone?: string | null;
    security_alerts_enabled?: boolean;
    mfa_enabled?: boolean;
  },
) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

export async function changePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
