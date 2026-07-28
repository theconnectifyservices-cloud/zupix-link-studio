/**
 * Bio Link add-on server functions (customer + admin).
 *
 * Effective Bio Link limit = plan limit + purchased add-ons.
 * All heavy/privileged work loads `*.server` modules inside handlers.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { BIO_LINK_ADDON_PRICE_MINOR } from "./plans";

export interface BioLinkAllowance {
  planLimit: number | null; // null = unlimited
  addonQuantity: number;
  effectiveLimit: number | null; // null = unlimited
  used: number;
  remaining: number | null;
  exceeded: boolean;
  addonPriceMinor: number;
}

export const getBioLinkAllowance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => {
    if (!d?.workspaceId) throw new Error("workspaceId required");
    return d;
  })
  .handler(async ({ data, context }): Promise<BioLinkAllowance> => {
    const supabase = context.supabase as any;
    const [{ data: effective }, { data: addonQty }, { count }] = await Promise.all([
      supabase.rpc("workspace_bio_link_limit", { _workspace_id: data.workspaceId }),
      supabase.rpc("workspace_bio_link_addons", { _workspace_id: data.workspaceId }),
      supabase
        .from("bio_pages")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", data.workspaceId)
        .is("deleted_at", null),
    ]);

    const eff = Number(effective ?? 1);
    const addons = Number(addonQty ?? 0);
    const unlimited = eff < 0;
    const used = count ?? 0;

    return {
      planLimit: unlimited ? null : Math.max(0, eff - addons),
      addonQuantity: addons,
      effectiveLimit: unlimited ? null : eff,
      used,
      remaining: unlimited ? null : Math.max(0, eff - used),
      exceeded: !unlimited && used >= eff,
      addonPriceMinor: BIO_LINK_ADDON_PRICE_MINOR,
    };
  });

/** Resolve plan id + amount for an add-on checkout of `quantity` Bio Links. */
export const prepareBioLinkAddonCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; quantity: number }) => {
    if (!d?.workspaceId) throw new Error("workspaceId required");
    const q = Math.min(50, Math.max(1, Math.floor(Number(d.quantity) || 1)));
    return { workspaceId: d.workspaceId, quantity: q };
  })
  .handler(async ({ data, context }) => {
    const supabase = context.supabase as any;
    const { data: sub } = await supabase
      .from("billing_subscriptions")
      .select("plan_id")
      .eq("workspace_id", data.workspaceId)
      .maybeSingle();

    let planId: string | null = sub?.plan_id ?? null;
    if (!planId) {
      const { data: plan } = await supabase
        .from("billing_plans")
        .select("id")
        .eq("code", "udaan")
        .maybeSingle();
      planId = plan?.id ?? null;
    }
    if (!planId) throw new Error("No billing plan available for this workspace");

    const amountPaise = BIO_LINK_ADDON_PRICE_MINOR * data.quantity;
    return {
      planId,
      quantity: data.quantity,
      amountPaise,
      currency: "INR",
      label: `${data.quantity} Additional Bio Link${data.quantity > 1 ? "s" : ""}`,
    };
  });

async function assertPlatformAdmin(context: any) {
  const [{ data: isAdmin }, { data: isSuper }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
  ]);
  if (!isAdmin && !isSuper) throw new Error("Forbidden");
}

export interface AdminAddonRow {
  workspaceId: string;
  workspaceName: string;
  planCode: string;
  planLimit: number | null;
  addonQuantity: number;
  effectiveLimit: number | null;
  used: number;
}

export const adminListBioLinkAddons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAddonRow[]> => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getBioLinkAddonRow } = await import("./addons.server");
    const addon = await getBioLinkAddonRow();

    const [{ data: workspaces }, { data: waRows }, { data: subs }, { data: plans }, { data: pages }] =
      await Promise.all([
        supabaseAdmin.from("workspaces").select("id, name").order("created_at", { ascending: false }).limit(500),
        supabaseAdmin
          .from("workspace_addons")
          .select("workspace_id, quantity, status")
          .eq("addon_id", addon.id)
          .eq("status", "active"),
        supabaseAdmin.from("billing_subscriptions").select("workspace_id, plan_id, status"),
        supabaseAdmin.from("billing_plans").select("id, code"),
        supabaseAdmin.from("bio_pages").select("workspace_id").is("deleted_at", null),
      ]);

    const { data: limits } = await supabaseAdmin
      .from("plan_limits")
      .select("plan_id, metric_key, limit_value, is_unlimited")
      .eq("metric_key", "bio_pages");

    const planCodeById = new Map((plans ?? []).map((p: any) => [p.id, p.code as string]));
    const limitByPlan = new Map(
      (limits ?? []).map((l: any) => [l.plan_id, l.is_unlimited ? null : Number(l.limit_value)]),
    );
    const subByWs = new Map((subs ?? []).map((s: any) => [s.workspace_id, s]));
    const addonByWs = new Map((waRows ?? []).map((r: any) => [r.workspace_id, Number(r.quantity)]));
    const usedByWs = new Map<string, number>();
    for (const p of pages ?? []) {
      usedByWs.set((p as any).workspace_id, (usedByWs.get((p as any).workspace_id) ?? 0) + 1);
    }

    return (workspaces ?? []).map((w: any) => {
      const sub = subByWs.get(w.id);
      const planCode = sub ? (planCodeById.get(sub.plan_id) ?? "udaan") : "udaan";
      const planLimit = sub ? (limitByPlan.get(sub.plan_id) ?? 1) : 1;
      const addonQuantity = addonByWs.get(w.id) ?? 0;
      return {
        workspaceId: w.id,
        workspaceName: w.name ?? "Workspace",
        planCode,
        planLimit: planLimit === null ? null : Number(planLimit),
        addonQuantity,
        effectiveLimit: planLimit === null ? null : Number(planLimit) + addonQuantity,
        used: usedByWs.get(w.id) ?? 0,
      };
    });
  });

/** Manually set the purchased add-on quantity for a workspace. */
export const adminSetBioLinkAddons = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; quantity: number; note?: string }) => {
    if (!d?.workspaceId) throw new Error("workspaceId required");
    return { ...d, quantity: Math.max(0, Math.floor(Number(d.quantity) || 0)) };
  })
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getBioLinkAddonRow } = await import("./addons.server");
    const addon = await getBioLinkAddonRow();

    const { data: rows } = await supabaseAdmin
      .from("workspace_addons")
      .select("id, quantity")
      .eq("workspace_id", data.workspaceId)
      .eq("addon_id", addon.id)
      .eq("status", "active");
    const existing = (rows ?? [])[0] as { id: string; quantity: number } | undefined;

    if (existing) {
      await supabaseAdmin
        .from("workspace_addons")
        .update({ quantity: data.quantity })
        .eq("id", existing.id);
    } else if (data.quantity > 0) {
      await supabaseAdmin.from("workspace_addons").insert({
        workspace_id: data.workspaceId,
        addon_id: addon.id,
        quantity: data.quantity,
        status: "active",
        metadata: { source: "admin" } as never,
      } as never);
    }

    await supabaseAdmin.from("billing_events").insert({
      workspace_id: data.workspaceId,
      event_type: "addon.bio_link.adjusted",
      actor_id: context.userId,
      metadata: {
        from: existing?.quantity ?? 0,
        to: data.quantity,
        note: data.note ?? null,
      } as never,
    } as never);

    return { ok: true, quantity: data.quantity };
  });

/** Purchase / adjustment history for a workspace's Bio Link add-ons. */
export const adminBioLinkAddonHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertPlatformAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("billing_events")
      .select("id, event_type, metadata, actor_id, created_at")
      .eq("workspace_id", data.workspaceId)
      .like("event_type", "addon.bio_link.%")
      .order("created_at", { ascending: false })
      .limit(50);
    return rows ?? [];
  });
