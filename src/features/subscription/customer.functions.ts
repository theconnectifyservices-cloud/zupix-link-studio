/**
 * Customer-facing subscription server fns for the "My Subscription" page.
 * All queries scoped to the caller's workspaces via RLS on billing_* tables.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => {
    if (!d?.workspaceId) throw new Error("workspaceId required");
    return d;
  })
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const [{ data: sub }, { data: plans }, { data: addonRows }] = await Promise.all([
      supabase
        .from("billing_subscriptions")
        .select(
          "id, plan_id, status, cycle, currency, unit_amount_minor, trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, paused_at, metadata",
        )
        .eq("workspace_id", data.workspaceId)
        .maybeSingle(),
      supabase
        .from("billing_plans")
        .select(
          "id, code, name, currency, trial_days, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor",
        ),
      supabase.from("addons").select("code, name, metric_key, price_minor, currency, quantity_per_unit, is_active"),
    ]);
    const planById = new Map<string, any>((plans ?? []).map((p: any) => [p.id, p]));
    const plan = sub ? (planById.get(sub.plan_id) ?? null) : null;

    // Usage
    const [{ count: bioCount }, { count: domCount }] = await Promise.all([
      supabase
        .from("bio_pages")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId)
        .is("deleted_at", null),
      supabase
        .from("domains")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId),
    ]);

    // Plan limits & features
    let limits: any[] = [];
    let features: any[] = [];
    if (sub?.plan_id) {
      const [{ data: l }, { data: f }] = await Promise.all([
        supabase.from("plan_limits").select("metric_key, limit_value, is_unlimited").eq("plan_id", sub.plan_id),
        supabase.from("plan_features").select("feature_key, enabled").eq("plan_id", sub.plan_id),
      ]);
      limits = l ?? [];
      features = f ?? [];
    }

    const cycle: string = sub?.cycle ?? "monthly";
    const cyclePriceMinor: number | null = plan
      ? (cycle === "yearly"
          ? plan.price_yearly_minor
          : cycle === "quarterly"
            ? plan.price_quarterly_minor
            : cycle === "lifetime"
              ? plan.price_lifetime_minor
              : plan.price_monthly_minor) ?? null
      : null;

    return {
      subscription: sub
        ? {
            ...sub,
            plan_code: plan?.code ?? null,
            plan_name: plan?.name ?? null,
            plan_currency: plan?.currency ?? sub.currency ?? "INR",
            plan_trial_days: plan?.trial_days ?? 0,
            plan_price_monthly_minor: plan?.price_monthly_minor ?? null,
            plan_price_yearly_minor: plan?.price_yearly_minor ?? null,
            /** Price the customer is charged for the current cycle (renewal price). */
            cycle_price_minor: cyclePriceMinor,
          }
        : null,
      usage: {
        bio_pages: bioCount ?? 0,
        custom_domains: domCount ?? 0,
      },
      limits,
      features,
      addons: (addonRows ?? []).filter((a: any) => a.is_active !== false),
    };
  });


export const listMyInvoices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: rows, error } = await supabase
      .from("billing_invoices")
      .select("id, invoice_number, status, total_minor, currency, issued_at, paid_at, pdf_url")
      .eq("workspace_id", data.workspaceId)
      .order("issued_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return rows ?? [];
  });
