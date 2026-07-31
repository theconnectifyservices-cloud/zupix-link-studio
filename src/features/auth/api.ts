import { supabase } from "@/integrations/supabase/client";

export interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  language: string | null;
  account_type: "creator" | "business" | "agency" | "personal" | null;
  status: "active" | "suspended" | "deleted";
  subscription_tier: string;
  active_workspace_id: string | null;
  onboarding_completed: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
  return { data };
}

/** Send a 6-digit SMS OTP to an E.164 phone number. Creates the user on first use. */
export async function sendPhoneOtp(phoneE164: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneE164,
    options: { channel: "sms", shouldCreateUser: true },
  });
  if (error) throw new Error(friendlyOtpError(error.message));
}

/** Verify the 6-digit SMS OTP and establish the session. */
export async function verifyPhoneOtp(phoneE164: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneE164,
    token,
    type: "sms",
  });
  if (error) throw new Error(friendlyOtpError(error.message));
  return data;
}

function friendlyOtpError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("sms") && (m.includes("provider") || m.includes("not enabled") || m.includes("disabled"))) {
    return "SMS sign-in is not switched on yet. Please try again shortly.";
  }
  if (m.includes("invalid") && m.includes("otp")) return "That code is incorrect. Please check and try again.";
  if (m.includes("expired")) return "That code has expired. Request a new one.";
  if (m.includes("rate") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  return message;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles" as never)
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function updateProfile(userId: string, patch: Partial<ProfileRow>) {
  const { error } = await supabase
    .from("profiles" as never)
    .update(patch as never)
    .eq("id", userId);
  if (error) throw error;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles" as never)
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  if (error) return false;
  return !data;
}

export async function fetchWorkspaces(userId: string): Promise<WorkspaceRow[]> {
  const { data, error } = await supabase
    .from("workspace_members" as never)
    .select("workspaces(*)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data as unknown as Array<{ workspaces: WorkspaceRow }>) ?? [])
    .map((r) => r.workspaces)
    .filter(Boolean);
}
