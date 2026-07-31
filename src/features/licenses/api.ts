import { supabase } from "@/integrations/supabase/client";
import { getDeviceId, getDeviceLabel } from "./device";
import type { LicenseActivation, ProductLicense } from "./types";

const db = supabase as unknown as { from: (t: string) => any; rpc: (n: string, a?: any) => any };

export async function listLicenses(search?: string): Promise<ProductLicense[]> {
  let q = db.from("product_licenses").select("*").order("created_at", { ascending: false }).limit(500);
  const s = search?.trim();
  if (s) q = q.or(`license_key.ilike.%${s}%,email.ilike.%${s}%,customer_name.ilike.%${s}%,phone.ilike.%${s}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data as ProductLicense[]) ?? [];
}

export async function generateKey(): Promise<string> {
  const { data, error } = await db.rpc("generate_license_key");
  if (error) throw error;
  return data as string;
}

export async function createLicense(input: Partial<ProductLicense>): Promise<ProductLicense> {
  const { data, error } = await db.from("product_licenses").insert(input).select().single();
  if (error) throw error;
  return data as ProductLicense;
}

export async function createLicensesBulk(rows: Partial<ProductLicense>[]): Promise<number> {
  const { data, error } = await db.from("product_licenses").insert(rows).select("id");
  if (error) throw error;
  return (data as unknown[])?.length ?? 0;
}

export async function updateLicense(id: string, patch: Partial<ProductLicense>) {
  const { error } = await db.from("product_licenses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteLicense(id: string) {
  const { error } = await db.from("product_licenses").delete().eq("id", id);
  if (error) throw error;
}

export async function regenerateLicenseKey(id: string): Promise<string> {
  const key = await generateKey();
  await updateLicense(id, { license_key: key });
  return key;
}

export async function listActivations(licenseId: string): Promise<LicenseActivation[]> {
  const { data, error } = await db
    .from("license_activations")
    .select("*")
    .eq("license_id", licenseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as LicenseActivation[]) ?? [];
}

export async function revokeActivation(id: string) {
  const { error } = await db
    .from("license_activations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Licence owned by the signed-in user (customer dashboard). */
export async function fetchMyLicense(userId: string): Promise<ProductLicense | null> {
  const { data, error } = await db
    .from("product_licenses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as ProductLicense | null) ?? null;
}

export interface RedeemResult {
  ok: boolean;
  reason?: string;
  maxDevices?: number | null;
}

/** Activate a licence key for the signed-in user on this device. */
export async function redeemLicense(key: string): Promise<RedeemResult> {
  const { data, error } = await db.rpc("redeem_license", {
    _key: key.trim(),
    _device_id: getDeviceId(),
    _device_label: getDeviceLabel(),
  });
  if (error) return { ok: false, reason: error.message };
  const r = (data ?? {}) as Record<string, unknown>;
  return { ok: Boolean(r.ok), reason: r.reason as string, maxDevices: (r.max_devices as number) ?? null };
}

/** Refresh licence last-login / expiry state after a successful sign-in. */
export async function touchLicenseLogin() {
  try {
    await db.rpc("touch_license_login", { _device_id: getDeviceId() });
  } catch {
    /* non-fatal */
  }
}

export function licensesToCsv(rows: ProductLicense[]): string {
  const headers = [
    "license_key",
    "customer_name",
    "email",
    "phone",
    "plan",
    "status",
    "expires_at",
    "created_at",
    "activated_at",
    "last_login_at",
    "max_devices",
    "notes",
  ];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc((r as unknown as Record<string, unknown>)[h])).join(",")),
  ].join("\n");
}
