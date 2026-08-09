import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const resolveUserSubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // 1. Get user's workspace
    const { data: workspace } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("owner_id", data.userId)
      .maybeSingle();

    if (!workspace) return null;

    // 2. Get active subscription
    const { data: sub } = await supabaseAdmin
      .from("billing_subscriptions")
      .select(`
        id, 
        plan_id, 
        status, 
        cycle, 
        currency, 
        unit_amount_minor, 
        current_period_end, 
        trial_end,
        billing_plans (
          id,
          code,
          name,
          tier,
          price_monthly_minor,
          price_yearly_minor
        )
      `)
      .eq("workspace_id", workspace.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) return null;

    const plan = sub.billing_plans as any;
    
    return {
      subscription_id: sub.id,
      plan_id: sub.plan_id,
      plan_code: plan?.code || "udaan",
      plan_name: plan?.name || "Udaan",
      plan_tier: plan?.tier || "free",
      status: sub.status,
      cycle: sub.cycle,
      price_minor: sub.unit_amount_minor,
      currency: sub.currency,
      expires_at: sub.current_period_end || sub.trial_end,
    };
  });
