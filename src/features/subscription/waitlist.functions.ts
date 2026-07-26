import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const joinWaitlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planCode: string; email: string; workspaceId?: string | null; note?: string | null }) => {
    if (!input?.planCode || !input?.email) throw new Error("planCode and email are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) throw new Error("Invalid email");
    if (input.planCode.length > 40) throw new Error("Invalid plan code");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("plan_waitlist").insert({
      user_id: userId,
      workspace_id: data.workspaceId ?? null,
      plan_code: data.planCode,
      email: data.email.trim().toLowerCase(),
      note: data.note ?? null,
    } as never);
    if (error && !/duplicate|unique/i.test(error.message)) throw error;
    return { ok: true };
  });

export const listWaitlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planCode?: string }) => input ?? {})
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isSuper } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" } as never);
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" } as never);
    if (!isSuper && !isAdmin) throw new Error("Admin role required");
    let q = supabase.from("plan_waitlist").select("id, plan_code, email, note, created_at, user_id, workspace_id").order("created_at", { ascending: false });
    if (data.planCode) q = q.eq("plan_code", data.planCode);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
