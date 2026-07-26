import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: unknown; userId: string }) {
  const supabase = context.supabase as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown }> };
  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (!isSuper && !isAdmin) throw new Error("Admin role required");
}

export const updatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    code: string;
    name?: string;
    description?: string | null;
    price_monthly_minor?: number | null;
    price_yearly_minor?: number | null;
    currency?: string;
    is_public?: boolean;
    is_active?: boolean;
    sort_order?: number;
    metadata?: Record<string, unknown>;
  }) => {
    if (!input?.code) throw new Error("Plan code required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { code, ...rest } = data;
    const patch = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    const { error } = await context.supabase.from("billing_plans").update(patch as never).eq("code", code);
    if (error) throw error;
    return { ok: true };
  });

export const setPlanFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planCode: string; featureKey: string; enabled: boolean }) => {
    if (!input?.planCode || !input?.featureKey) throw new Error("planCode and featureKey required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: plan, error: perr } = await context.supabase.from("billing_plans").select("id").eq("code", data.planCode).maybeSingle();
    if (perr) throw perr;
    if (!plan) throw new Error("Plan not found");
    const { error } = await context.supabase
      .from("plan_features")
      .upsert({ plan_id: (plan as { id: string }).id, feature_key: data.featureKey, enabled: data.enabled, config: {} } as never, {
        onConflict: "plan_id,feature_key",
      });
    if (error) throw error;
    return { ok: true };
  });

export const setPlanLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { planCode: string; metricKey: string; limitValue: number; isUnlimited: boolean }) => {
    if (!input?.planCode || !input?.metricKey) throw new Error("planCode and metricKey required");
    return input;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { data: plan, error: perr } = await context.supabase.from("billing_plans").select("id").eq("code", data.planCode).maybeSingle();
    if (perr) throw perr;
    if (!plan) throw new Error("Plan not found");
    const { error } = await context.supabase
      .from("plan_limits")
      .upsert({
        plan_id: (plan as { id: string }).id,
        metric_key: data.metricKey,
        limit_value: data.limitValue,
        is_unlimited: data.isUnlimited,
      } as never, { onConflict: "plan_id,metric_key" });
    if (error) throw error;
    return { ok: true };
  });
