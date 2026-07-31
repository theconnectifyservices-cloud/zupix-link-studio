/**
 * Admin-only server functions: password resets, temporary passwords and
 * user lookup for the Admin → Users module.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  const { data: isSuper } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "super_admin",
  });
  if (!isAdmin && !isSuper) throw new Error("Forbidden");
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "Zx";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return `${out}#7`;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  status: string | null;
  force_password_change: boolean;
  temp_password_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
  license_key: string | null;
}

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { search?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = (supabaseAdmin as any)
      .from("profiles")
      .select(
        "id, email, phone, display_name, status, force_password_change, temp_password_expires_at, last_login_at, created_at, license_id",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    const search = data.search?.trim();
    if (search) q = q.or(`email.ilike.%${search}%,phone.ilike.%${search}%,display_name.ilike.%${search}%`);
    const { data: rows, error } = await q;
    if (error) throw error;

    const ids = (rows ?? []).map((r: any) => r.license_id).filter(Boolean);
    let keyById = new Map<string, string>();
    if (ids.length) {
      const { data: lics } = await (supabaseAdmin as any)
        .from("product_licenses")
        .select("id, license_key")
        .in("id", ids);
      keyById = new Map((lics ?? []).map((l: any) => [l.id, l.license_key]));
    }
    return (rows ?? []).map((r: any) => ({
      ...r,
      license_key: r.license_id ? (keyById.get(r.license_id) ?? null) : null,
    }));
  });

export const adminSetPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        password: z.string().min(8).max(72).optional(),
        temporary: z.boolean().optional(),
        forceChange: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; password?: string }> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = data.password ?? randomPassword();

    const { error } = await (supabaseAdmin as any).auth.admin.updateUserById(data.userId, {
      password,
    });
    if (error) throw error;

    await (supabaseAdmin as any)
      .from("profiles")
      .update({
        force_password_change: data.forceChange ?? data.temporary ?? false,
        temp_password_expires_at: data.temporary
          ? new Date(Date.now() * 1 + 24 * 60 * 60 * 1000).toISOString()
          : null,
      })
      .eq("id", data.userId);

    return { ok: true, password: data.password ? undefined : password };
  });

export const adminForcePasswordChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), force: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("profiles")
      .update({ force_password_change: data.force })
      .eq("id", data.userId);
    return { ok: true };
  });

export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), redirectTo: z.string().url() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await (supabaseAdmin as any).auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    });
    if (error) throw error;
    return { ok: true };
  });
