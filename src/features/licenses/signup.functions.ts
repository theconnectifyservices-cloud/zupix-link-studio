/**
 * Public (unauthenticated) signup + licence verification server functions.
 * Runs with the service role INSIDE the handler only.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const signupInput = z.object({
  /** Optional when the licence already carries the customer details. */
  fullName: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  password: z.string().min(8).max(72),
  /** Optional — omitted for the default trial signup flow. */
  licenseKey: z.string().trim().min(4).max(64).optional(),
  deviceId: z.string().trim().max(80).optional(),
  deviceLabel: z.string().trim().max(120).optional(),
});

export interface SignupResult {
  ok: boolean;
  reason?: string;
  maxDevices?: number | null;
  userId?: string;
  /** Resolved account email (may come from the licence record). */
  email?: string;
}

export const verifyLicenseKey = createServerFn({ method: "POST" })
  .inputValidator((d: { licenseKey: string }) =>
    z.object({ licenseKey: z.string().trim().min(1).max(64) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ valid: boolean; reason?: string; plan?: string; maxDevices?: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: res, error } = await (supabaseAdmin as any).rpc("validate_license_key", {
      _key: data.licenseKey,
    });
    if (error) return { valid: false, reason: "invalid" };
    const r = (res ?? {}) as Record<string, unknown>;
    return {
      valid: Boolean(r.valid),
      reason: (r.reason as string) ?? undefined,
      plan: (r.plan as string) ?? undefined,
      maxDevices: (r.max_devices as number) ?? undefined,
    };
  });

/**
 * Step 1 of the licence activation flow: validate the key and report whether the
 * licence already carries the customer's details.
 */
export const inspectLicenseKey = createServerFn({ method: "POST" })
  .inputValidator((d: { licenseKey: string }) =>
    z.object({ licenseKey: z.string().trim().min(1).max(64) }).parse(d),
  )
  .handler(
    async ({
      data,
    }): Promise<{
      valid: boolean;
      reason?: string;
      plan?: string;
      maxDevices?: number | null;
      hasCustomer: boolean;
      customer?: { fullName: string; email: string; phone: string };
    }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const admin = supabaseAdmin as any;
      const { data: lic } = await admin
        .from("product_licenses")
        .select("id, status, expires_at, max_devices, user_id, plan, customer_name, email, phone")
        .ilike("license_key", data.licenseKey.trim())
        .maybeSingle();

      if (!lic) return { valid: false, reason: "invalid", hasCustomer: false };
      if (lic.user_id) return { valid: false, reason: "already_used", hasCustomer: false };
      if (["revoked", "suspended", "expired"].includes(lic.status))
        return { valid: false, reason: lic.status, hasCustomer: false };
      if (lic.expires_at && new Date(lic.expires_at).getTime() < Date.now())
        return { valid: false, reason: "expired", hasCustomer: false };

      const { count } = await admin
        .from("license_activations")
        .select("id", { count: "exact", head: true })
        .eq("license_id", lic.id)
        .is("revoked_at", null);
      if (lic.max_devices >= 0 && (count ?? 0) >= lic.max_devices)
        return {
          valid: false,
          reason: "device_limit",
          maxDevices: lic.max_devices,
          hasCustomer: false,
        };

      const fullName = (lic.customer_name ?? "").trim();
      const email = (lic.email ?? "").trim().toLowerCase();
      const phone = (lic.phone ?? "").trim();
      const hasCustomer = Boolean(fullName && email && phone);

      // A licence pre-filled with a customer whose email/phone is already registered
      // cannot silently create a duplicate account.
      if (hasCustomer) {
        const { data: avail } = await admin.rpc("check_signup_availability", {
          _email: email,
          _phone: phone.replace(/[^\d+]/g, ""),
        });
        if (avail?.email_taken || avail?.phone_taken)
          return {
            valid: false,
            reason: avail?.email_taken ? "email_taken" : "phone_taken",
            hasCustomer: false,
          };
      }

      return {
        valid: true,
        plan: lic.plan ?? undefined,
        maxDevices: lic.max_devices ?? null,
        hasCustomer,
        customer: hasCustomer ? { fullName, email, phone } : undefined,
      };
    },
  );

export const signUpWithLicense = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signupInput.parse(d))
  .handler(async ({ data }): Promise<SignupResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    const licenseKey = data.licenseKey?.trim();
    let lic: any = null;

    // 1. When a licence key is supplied it must be valid BEFORE the account is created
    if (licenseKey) {
      const { data: found } = await admin
        .from("product_licenses")
        .select("id, status, expires_at, max_devices, user_id, customer_name, email, phone")
        .ilike("license_key", licenseKey)
        .maybeSingle();
      lic = found;
      if (!lic) return { ok: false, reason: "invalid" };
      if (lic.user_id) return { ok: false, reason: "already_used" };
      if (["revoked", "suspended", "expired"].includes(lic.status))
        return { ok: false, reason: lic.status };
      if (lic.expires_at && new Date(lic.expires_at).getTime() < Date.now())
        return { ok: false, reason: "expired" };

      const { count } = await admin
        .from("license_activations")
        .select("id", { count: "exact", head: true })
        .eq("license_id", lic.id)
        .is("revoked_at", null);
      if (lic.max_devices >= 0 && (count ?? 0) >= lic.max_devices)
        return { ok: false, reason: "device_limit", maxDevices: lic.max_devices };
    }

    // 2. Resolve identity — the licence's stored customer wins when the client omits fields
    const fullName = (data.fullName ?? lic?.customer_name ?? "").trim();
    const email = (data.email ?? lic?.email ?? "").trim().toLowerCase();
    const phone = (data.phone ?? lic?.phone ?? "").replace(/[^\d+]/g, "");
    if (!fullName || !email || !phone) return { ok: false, reason: "missing_details" };

    // 3. Duplicate email / phone
    const { data: avail } = await admin.rpc("check_signup_availability", {
      _email: email,
      _phone: phone,
    });
    if (avail?.email_taken) return { ok: false, reason: "email_taken" };
    if (avail?.phone_taken) return { ok: false, reason: "phone_taken" };

    // 4. Create the account (trigger provisions workspace + 3-day UDAAN trial)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created?.user) {
      const m = (createErr?.message ?? "").toLowerCase();
      if (m.includes("phone")) return { ok: false, reason: "phone_taken" };
      if (m.includes("already") || m.includes("registered")) return { ok: false, reason: "email_taken" };
      return { ok: false, reason: createErr?.message ?? "signup_failed" };
    }
    const userId = created.user.id as string;

    if (!lic) {
      // Default trial onboarding — no licence attached yet.
      await admin
        .from("profiles")
        .update({ display_name: fullName, phone, license_activation_status: "none" })
        .eq("id", userId);
      return { ok: true, userId };
    }

    // 5. Link + activate the licence
    await admin
      .from("profiles")
      .update({
        display_name: fullName,
        phone,
        license_id: lic.id,
        license_activation_status: "active",
      })
      .eq("id", userId);
    await admin.from("license_activations").upsert(
      {
        license_id: lic.id,
        user_id: userId,
        device_id: data.deviceId || `srv_${userId}`,
        device_label: data.deviceLabel ?? null,
      },
      { onConflict: "license_id,device_id" },
    );
    await admin
      .from("product_licenses")
      .update({
        user_id: userId,
        status: "active",
        activated_at: new Date().toISOString(),
        customer_name: fullName,
        email,
        phone,
      })
      .eq("id", lic.id);

    return { ok: true, userId, email };
  });

/** Simple login rate limiting: max 8 failed attempts per identifier / 15 min. */
export const checkLoginRate = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string }) =>
    z.object({ identifier: z.string().trim().min(1).max(255) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ allowed: boolean; retryInMinutes?: number }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await (supabaseAdmin as any)
      .from("auth_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("identifier", data.identifier.toLowerCase())
      .eq("success", false)
      .gte("created_at", since);
    return (count ?? 0) >= 8 ? { allowed: false, retryInMinutes: 15 } : { allowed: true };
  });

export const recordLoginAttempt = createServerFn({ method: "POST" })
  .inputValidator((d: { identifier: string; success: boolean }) =>
    z.object({ identifier: z.string().trim().min(1).max(255), success: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("auth_login_attempts")
      .insert({ identifier: data.identifier.toLowerCase(), success: data.success });
    return { ok: true };
  });
