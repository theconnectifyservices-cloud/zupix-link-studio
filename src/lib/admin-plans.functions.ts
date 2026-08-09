import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const updatePlanInput = z.object({
  userId: z.string().uuid(),
  planCode: z.string(),
  billingCycle: z.enum(["monthly", "yearly"]),
});

export const getAdminPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await (supabaseAdmin as any).rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Unauthorized");

    const { data: plans, error } = await supabaseAdmin
      .from("billing_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    if (error) throw error;
    return plans;
  });

export const updateAdminUserPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updatePlanInput.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await (supabaseAdmin as any).rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Unauthorized");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier")
      .eq("id", data.userId)
      .single();

    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_id", data.userId)
      .single();

    if (!workspace) throw new Error("User has no workspace");

    const { data: targetPlan } = await supabaseAdmin
      .from("billing_plans")
      .select("id, code, tier, price_monthly_minor, price_yearly_minor, currency")
      .eq("code", data.planCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!targetPlan) throw new Error("Plan not found");

    const now = new Date().toISOString();
    const cycle = targetPlan.tier === "free" ? "monthly" : data.billingCycle;
    const unitAmount = targetPlan.tier === "free" ? 0 : 
      (cycle === "monthly" ? targetPlan.price_monthly_minor : targetPlan.price_yearly_minor);

    const periodEnd = new Date();
    if (cycle === "monthly") periodEnd.setMonth(periodEnd.getMonth() + 1);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const { data: sub, error: subError } = await supabaseAdmin
      .from("billing_subscriptions")
      .upsert({
        workspace_id: workspace.id,
        plan_id: targetPlan.id,
        status: "active",
        cycle: cycle as any,
        currency: targetPlan.currency || "INR",
        unit_amount_minor: unitAmount || 0,
        quantity: 1,
        gateway: "manual",
        current_period_start: now,
        current_period_end: targetPlan.tier === "free" ? null : periodEnd.toISOString(),
        updated_at: now
      }, { onConflict: "workspace_id" })
      .select("id")
      .single();

    if (subError) throw subError;

    await supabaseAdmin
      .from("profiles")
      .update({ subscription_tier: targetPlan.code } as any)
      .eq("id", data.userId);

    await supabaseAdmin.from("activity_logs").insert({
      user_id: context.userId,
      action: "update" as any,
      target_id: data.userId,
      target_type: "user_plan",
      metadata: {
        previous_plan: profile?.subscription_tier,
        new_plan: targetPlan.code,
        cycle: data.billingCycle,
        admin_id: context.userId,
        reason: "Admin manual override"
      }
    });

    return { success: true };
  });
