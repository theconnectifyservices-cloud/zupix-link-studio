/**
 * Customer Subscription Management — admin server functions.
 * Wraps existing billing tables (billing_subscriptions, billing_plans,
 * billing_invoices, billing_payments) plus subscription_change_logs for audit.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";
type SubscriptionAction =
  | "extend"
  | "upgrade"
  | "downgrade"
  | "suspend"
  | "resume"
  | "cancel";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const [{ data: s }, { data: a }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (!s && !a) throw new Error("Admin role required");
}

async function insertChangeLog(args: {
  workspaceId: string;
  subscriptionId: string | null;
  actorId: string;
  action: string;
  fromPlanCode?: string | null;
  toPlanCode?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("subscription_change_logs").insert({
    workspace_id: args.workspaceId,
    subscription_id: args.subscriptionId,
    actor_id: args.actorId,
    action: args.action,
    from_plan_code: args.fromPlanCode ?? null,
    to_plan_code: args.toPlanCode ?? null,
    from_status: args.fromStatus ?? null,
    to_status: args.toStatus ?? null,
    metadata: args.metadata ?? {},
  } as never);
}

async function notifyOwner(args: {
  workspaceId: string;
  title: string;
  body: string;
  actionUrl?: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: ws } = await supabaseAdmin
    .from("workspaces")
    .select("owner_id")
    .eq("id", args.workspaceId)
    .maybeSingle();
  if (!ws?.owner_id) return;
  await supabaseAdmin.from("notifications").insert({
    user_id: ws.owner_id,
    workspace_id: args.workspaceId,
    type: "billing",
    title: args.title,
    body: args.body,
    action_url: args.actionUrl ?? "/app/my-subscription",
  } as never);
}

/** List customer subscriptions with joined workspace + owner + plan. */
export const listCustomerSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { query?: string; planCode?: string; status?: string; limit?: number; offset?: number }) => d ?? {},
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limit = Math.min(Math.max(data.limit ?? 50, 1), 200);
    const offset = Math.max(data.offset ?? 0, 0);

    // 1) Base workspace list (search)
    let wsQuery = supabaseAdmin
      .from("workspaces")
      .select("id, name, slug, owner_id, created_at")
      .order("created_at", { ascending: false });
    if (data.query && data.query.trim()) {
      const t = data.query.trim();
      wsQuery = wsQuery.or(`name.ilike.%${t}%,slug.ilike.%${t}%`);
    }
    const { data: wsRows, error: wsErr } = await wsQuery.range(offset, offset + limit - 1);
    if (wsErr) throw wsErr;
    if (!wsRows || wsRows.length === 0) return { rows: [], total: 0 };

    const wsIds = wsRows.map((w) => w.id);
    const ownerIds = Array.from(new Set(wsRows.map((w) => w.owner_id).filter(Boolean)));

    const [{ data: subs }, { data: profs }, { data: plans }] = await Promise.all([
      supabaseAdmin
        .from("billing_subscriptions")
        .select(
          "id, workspace_id, plan_id, status, cycle, currency, unit_amount_minor, trial_end, current_period_start, current_period_end, cancel_at_period_end, canceled_at, paused_at, ended_at, updated_at, metadata",
        )
        .in("workspace_id", wsIds)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("profiles").select("id, display_name, email, phone").in("id", ownerIds),
      supabaseAdmin
        .from("billing_plans")
        .select("id, code, name, currency, price_monthly_minor, price_yearly_minor"),
    ]);

    const subByWs = new Map<string, any>();
    for (const s of subs ?? []) if (!subByWs.has(s.workspace_id)) subByWs.set(s.workspace_id, s);
    const profById = new Map((profs ?? []).map((p) => [p.id, p]));
    const planById = new Map((plans ?? []).map((p) => [p.id, p]));

    let rows = wsRows.map((w) => {
      const sub = subByWs.get(w.id) ?? null;
      const owner = profById.get(w.owner_id);
      const plan = sub ? planById.get(sub.plan_id) : null;
      const expiry = sub?.current_period_end ?? sub?.trial_end ?? null;
      const daysRemaining = expiry
        ? Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000))
        : null;
      return {
        workspace_id: w.id,
        workspace_name: w.name,
        workspace_slug: w.slug,
        customer_id: w.id.slice(0, 8).toUpperCase(),
        customer_name: owner?.display_name ?? "—",
        email: owner?.email ?? "—",
        phone: owner?.phone ?? null,
        subscription_id: sub?.id ?? null,
        plan_code: plan?.code ?? "",
        plan_name: plan?.name ?? "No plan",
        status: sub?.status ?? "none",
        cycle: sub?.cycle ?? null,
        start_date: sub?.current_period_start ?? null,
        expiry_date: expiry,
        days_remaining: daysRemaining,
        auto_renewal: sub ? !sub.cancel_at_period_end : false,
        account_status: sub?.status === "expired" || sub?.status === "canceled" ? "inactive" : "active",
        updated_at: sub?.updated_at ?? w.created_at,
        overrides: (sub?.metadata as any)?.overrides ?? null,
      };
    });

    if (data.planCode) rows = rows.filter((r) => r.plan_code === data.planCode);
    if (data.status) rows = rows.filter((r) => r.status === data.status);

    return { rows, total: rows.length };
  });

/** Assign a plan to a workspace (create or replace subscription). */
export const assignSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      planCode: string;
      cycle: Cycle;
      durationDays?: number;
      priceMinor?: number;
      overrides?: Record<string, unknown>;
      note?: string;
    }) => {
      if (!d?.workspaceId || !d?.planCode) throw new Error("workspaceId & planCode required");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: plan, error: pErr } = await supabaseAdmin
      .from("billing_plans")
      .select("id, code, name, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
      .eq("code", data.planCode)
      .maybeSingle();
    if (pErr || !plan) throw new Error("Plan not found");

    const defaultMinor =
      data.cycle === "monthly" ? plan.price_monthly_minor :
      data.cycle === "quarterly" ? plan.price_quarterly_minor :
      data.cycle === "yearly" ? plan.price_yearly_minor :
      plan.price_lifetime_minor;
    const amountMinor = data.priceMinor ?? Number(defaultMinor ?? 0);

    const defaultDays =
      data.cycle === "monthly" ? 30 :
      data.cycle === "quarterly" ? 90 :
      data.cycle === "yearly" ? 365 :
      3650;
    const days = data.durationDays ?? defaultDays;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + days * 86400000);

    // Existing sub → capture previous
    const { data: existing } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("id, plan_id, status")
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();

    const { data: fromPlan } = existing?.plan_id
      ? await supabaseAdmin.from("billing_plans").select("code").eq("id", existing.plan_id).maybeSingle()
      : { data: null };

    const payload = {
      workspace_id: data.workspaceId,
      plan_id: plan.id,
      status: "active",
      cycle: data.cycle,
      currency: plan.currency ?? "INR",
      unit_amount_minor: amountMinor,
      quantity: 1,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      canceled_at: null,
      paused_at: null,
      ended_at: null,
      metadata: {
        assigned_by: context.userId,
        note: data.note ?? null,
        overrides: data.overrides ?? {},
        source: "admin_assign",
      },
    };

    let subId: string;
    if (existing) {
      const { data: upd, error } = await supabaseAdmin
        .from("billing_subscriptions")
        .update(payload as never)
        .eq("id", existing.id)
        .select("id")
        .single();
      if (error) throw error;
      subId = upd.id;
    } else {
      const { data: ins, error } = await supabaseAdmin
        .from("billing_subscriptions")
        .insert(payload as never)
        .select("id")
        .single();
      if (error) throw error;
      subId = ins.id;
    }

    await insertChangeLog({
      workspaceId: data.workspaceId,
      subscriptionId: subId,
      actorId: context.userId,
      action: "assign",
      fromPlanCode: fromPlan?.code ?? null,
      toPlanCode: plan.code,
      fromStatus: existing?.status ?? null,
      toStatus: "active",
      metadata: { cycle: data.cycle, days, amountMinor, overrides: data.overrides ?? {} },
    });

    await notifyOwner({
      workspaceId: data.workspaceId,
      title: `Your plan is now ${plan.name} 🎉`,
      body: `An admin activated the ${plan.name} plan on your workspace. Enjoy the new features.`,
    });

    return { ok: true, subscriptionId: subId };
  });

/** Update an existing subscription (extend/upgrade/downgrade/suspend/resume/cancel). */
export const updateCustomerSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      action: SubscriptionAction;
      extendDays?: number;
      newPlanCode?: string;
      newCycle?: Cycle;
    }) => {
      if (!d?.workspaceId || !d?.action) throw new Error("workspaceId & action required");
      return d;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub, error: sErr } = await supabaseAdmin
      .from("billing_subscriptions")
      .select("id, plan_id, status, cycle, current_period_end, cancel_at_period_end")
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!sub) throw new Error("No subscription found for this workspace");

    const { data: fromPlan } = await supabaseAdmin
      .from("billing_plans")
      .select("code, name")
      .eq("id", sub.plan_id)
      .maybeSingle();

    const patch: Record<string, unknown> = {};
    let toStatus = sub.status;
    let toPlanCode = fromPlan?.code ?? null;
    let title = "Subscription updated";
    let body = "Your subscription was updated by an admin.";

    if (data.action === "extend") {
      const days = Math.max(1, Math.min(3650, data.extendDays ?? 30));
      const base = sub.current_period_end ? new Date(sub.current_period_end) : new Date();
      const newEnd = new Date(base.getTime() + days * 86400000);
      patch.current_period_end = newEnd.toISOString();
      if (sub.status === "expired" || sub.status === "canceled") {
        patch.status = "active";
        patch.ended_at = null;
        patch.canceled_at = null;
        toStatus = "active";
      }
      title = `Your plan was extended by ${days} days`;
      body = `New expiry: ${newEnd.toDateString()}.`;
    } else if (data.action === "upgrade" || data.action === "downgrade") {
      if (!data.newPlanCode) throw new Error("newPlanCode required");
      const { data: newPlan } = await supabaseAdmin
        .from("billing_plans")
        .select("id, code, name, currency, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor")
        .eq("code", data.newPlanCode)
        .maybeSingle();
      if (!newPlan) throw new Error("New plan not found");
      const cycle = (data.newCycle ?? sub.cycle) as Cycle;
      const minor =
        cycle === "monthly" ? newPlan.price_monthly_minor :
        cycle === "quarterly" ? newPlan.price_quarterly_minor :
        cycle === "yearly" ? newPlan.price_yearly_minor :
        newPlan.price_lifetime_minor;
      patch.plan_id = newPlan.id;
      patch.cycle = cycle;
      patch.unit_amount_minor = Number(minor ?? 0);
      patch.currency = newPlan.currency ?? "INR";
      patch.status = "active";
      toStatus = "active";
      toPlanCode = newPlan.code;
      title = data.action === "upgrade" ? `Upgraded to ${newPlan.name}` : `Plan changed to ${newPlan.name}`;
      body = `Your workspace now runs on the ${newPlan.name} plan.`;
    } else if (data.action === "suspend") {
      patch.status = "paused";
      patch.paused_at = new Date().toISOString();
      toStatus = "paused";
      title = "Your subscription was suspended";
      body = "Please contact support if this was unexpected.";
    } else if (data.action === "resume") {
      patch.status = "active";
      patch.paused_at = null;
      toStatus = "active";
      title = "Your subscription is active again";
      body = "Welcome back — all features are unlocked.";
    } else if (data.action === "cancel") {
      patch.status = "canceled";
      patch.canceled_at = new Date().toISOString();
      patch.cancel_at_period_end = true;
      toStatus = "canceled";
      title = "Your subscription was canceled";
      body = "You retain access until the current period ends.";
    }

    const { error: uErr } = await supabaseAdmin
      .from("billing_subscriptions")
      .update(patch as never)
      .eq("id", sub.id);
    if (uErr) throw uErr;

    await insertChangeLog({
      workspaceId: data.workspaceId,
      subscriptionId: sub.id,
      actorId: context.userId,
      action: data.action,
      fromPlanCode: fromPlan?.code ?? null,
      toPlanCode,
      fromStatus: sub.status,
      toStatus,
      metadata: { patch },
    });

    await notifyOwner({ workspaceId: data.workspaceId, title, body });

    return { ok: true };
  });

/** Delete a subscription row (hard). Use only for cleanup. */
export const deleteCustomerSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => {
    if (!d?.workspaceId) throw new Error("workspaceId required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("billing_subscriptions").select("id, plan_id, status").eq("workspace_id", data.workspaceId).maybeSingle();
    if (!sub) return { ok: true };
    const { data: fromPlan } = await supabaseAdmin.from("billing_plans").select("code").eq("id", sub.plan_id).maybeSingle();
    const { error } = await supabaseAdmin.from("billing_subscriptions").delete().eq("id", sub.id);
    if (error) throw error;
    await insertChangeLog({
      workspaceId: data.workspaceId,
      subscriptionId: null,
      actorId: context.userId,
      action: "delete",
      fromPlanCode: fromPlan?.code ?? null,
      fromStatus: sub.status,
    });
    return { ok: true };
  });

/** Fetch one subscription with change history for the drawer. */
export const getSubscriptionDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: sub }, { data: logs }, { data: invoices }] = await Promise.all([
      supabaseAdmin
        .from("billing_subscriptions")
        .select("*")
        .eq("workspace_id", data.workspaceId)
        .maybeSingle(),
      supabaseAdmin
        .from("subscription_change_logs")
        .select("*")
        .eq("workspace_id", data.workspaceId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("billing_invoices")
        .select("id, invoice_number, status, total_minor, currency, issued_at, paid_at, pdf_url")
        .eq("workspace_id", data.workspaceId)
        .order("issued_at", { ascending: false })
        .limit(20),
    ]);
    return { subscription: sub ?? null, logs: logs ?? [], invoices: invoices ?? [] };
  });
