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
    const [{ data: sub }, { data: plans }] = await Promise.all([
      supabase
        .from("billing_subscriptions")
        .select(
          "id, plan_id, status, cycle, currency, unit_amount_minor, trial_start, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, paused_at, metadata",
        )
        .eq("workspace_id", data.workspaceId)
        .maybeSingle(),
      supabase.from("billing_plans").select("id, code, name, currency"),
    ]);
    const planById = new Map<string, { code: string; name: string; currency: string }>(
      (plans ?? []).map((p: any) => [p.id, p]),
    );
    const plan = sub ? planById.get(sub.plan_id) : null;

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

    return {
      subscription: sub
        ? {
            ...sub,
            plan_code: plan?.code ?? "udaan",
            plan_name: plan?.name ?? "Free (Udaan)",
          }
        : null,
      usage: {
        bio_pages: bioCount ?? 0,
        custom_domains: domCount ?? 0,
      },
      limits,
      features,
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
