/**
 * Manual UPI review workflow — customer submission + admin review server fns.
 *
 * Admins reach this queue platform-wide, so listing/detail queries use the
 * service-role client (still gated behind requireSupabaseAuth + a role check)
 * to include workspaces where the platform admin is not a workspace member.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertPlatformOrWorkspaceAdmin(
  context: { supabase: any; userId: string },
  workspaceId?: string | null,
) {
  const [{ data: isSuper }, { data: isAdmin }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "super_admin" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (isSuper || isAdmin) return "platform" as const;
  if (workspaceId) {
    const { data: isWs } = await context.supabase.rpc("is_workspace_admin", {
      _user_id: context.userId,
      _workspace_id: workspaceId,
    });
    if (isWs) return "workspace" as const;
  }
  throw new Error("Forbidden: admin role required");
}

/** Customer uploads a UPI screenshot / UTR — RLS scoped to the submitter. */
export const submitUpiProof = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; screenshotUrl?: string; txnRef?: string; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("payment_orders")
      .select("workspace_id, user_id")
      .eq("id", data.orderId)
      .single();
    if (error || !order) throw new Error("Order not found");
    if (order.user_id !== context.userId) throw new Error("Forbidden");

    const { data: row, error: iErr } = await context.supabase
      .from("manual_upi_submissions")
      .insert({
        order_id: data.orderId,
        workspace_id: order.workspace_id,
        submitted_by: context.userId,
        screenshot_url: data.screenshotUrl,
        txn_ref: data.txnRef,
        notes: data.notes,
      })
      .select("*")
      .single();
    if (iErr) throw iErr;

    await context.supabase
      .from("payment_orders")
      .update({ status: "manual_review" })
      .eq("id", data.orderId);
    return row;
  });

type ListInput = {
  workspaceId?: string | null;
  status?: "pending" | "approved" | "rejected" | "all";
  search?: string;
  range?: "today" | "yesterday" | "week" | "all";
};

async function enrichSubmissions(rows: any[]) {
  if (!rows.length) return rows;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const userIds = Array.from(new Set(rows.flatMap((r) => [r.submitted_by, r.reviewed_by]).filter(Boolean)));
  const wsIds = Array.from(new Set(rows.map((r) => r.workspace_id).filter(Boolean)));
  const planIds = Array.from(new Set(rows.map((r) => r.order?.plan_id).filter(Boolean)));

  const [{ data: profiles }, { data: workspaces }, { data: plans }] = await Promise.all([
    userIds.length
      ? supabaseAdmin.from("profiles").select("id, email, display_name, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] as any[] }),
    wsIds.length
      ? supabaseAdmin.from("workspaces").select("id, name, slug").in("id", wsIds)
      : Promise.resolve({ data: [] as any[] }),
    planIds.length
      ? supabaseAdmin.from("billing_plans").select("id, code, name").in("id", planIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const wMap = new Map((workspaces ?? []).map((w: any) => [w.id, w]));
  const planMap = new Map((plans ?? []).map((pl: any) => [pl.id, pl]));

  return rows.map((r) => ({
    ...r,
    customer: pMap.get(r.submitted_by) ?? null,
    reviewer: r.reviewed_by ? pMap.get(r.reviewed_by) ?? null : null,
    workspace: wMap.get(r.workspace_id) ?? null,
    plan: r.order?.plan_id ? planMap.get(r.order.plan_id) ?? null : null,
  }));
}

/** Full-featured review queue with status/date/search filters. */
export const listUpiSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ListInput) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertPlatformOrWorkspaceAdmin(context, data.workspaceId ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = supabaseAdmin
      .from("manual_upi_submissions")
      .select("*, order:payment_orders(id, amount_paise, currency, plan_id, meta, provider, created_at)")
      .order("created_at", { ascending: false })
      .limit(200);

    if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId);
    if (data.status && data.status !== "all") q = q.eq("status", data.status);
    if (data.range && data.range !== "all") {
      const now = new Date();
      const start = new Date(now);
      if (data.range === "today") start.setHours(0, 0, 0, 0);
      else if (data.range === "yesterday") { start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0); }
      else if (data.range === "week") { start.setDate(now.getDate() - 7); }
      q = q.gte("created_at", start.toISOString());
    }
    if (data.search && data.search.trim()) {
      q = q.or(`txn_ref.ilike.%${data.search}%,notes.ilike.%${data.search}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw error;
    return enrichSubmissions(rows ?? []);
  });

/** Back-compat helper used by the hub badge counter. */
export const listPendingUpiSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null }) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertPlatformOrWorkspaceAdmin(context, data.workspaceId ?? null);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("manual_upi_submissions")
      .select("*, order:payment_orders(id, amount_paise, currency, plan_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return enrichSubmissions(rows ?? []);
  });

/** Single-submission detail with joined customer / workspace / plan / invoice. */
export const getUpiSubmission = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("manual_upi_submissions")
      .select("*, order:payment_orders(*)")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Submission not found");
    await assertPlatformOrWorkspaceAdmin(context, row.workspace_id);

    const [enriched] = await enrichSubmissions([row]);
    const { data: invoice } = row.order_id
      ? await supabaseAdmin
          .from("billing_invoices")
          .select("id, invoice_number, status, total_minor, currency, issued_at")
          .eq("workspace_id", row.workspace_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null } as any;
    return { ...enriched, invoice: invoice ?? null };
  });

/** Widget stats: pending / approved today / rejected today / avg review time. */
export const getUpiReviewStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertPlatformOrWorkspaceAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const [{ count: pending }, { count: approvedToday }, { count: rejectedToday }, { data: recent }] = await Promise.all([
      supabaseAdmin.from("manual_upi_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("manual_upi_submissions").select("*", { count: "exact", head: true })
        .eq("status", "approved").gte("reviewed_at", startOfDay.toISOString()),
      supabaseAdmin.from("manual_upi_submissions").select("*", { count: "exact", head: true })
        .eq("status", "rejected").gte("reviewed_at", startOfDay.toISOString()),
      supabaseAdmin.from("manual_upi_submissions").select("created_at, reviewed_at")
        .not("reviewed_at", "is", null).order("reviewed_at", { ascending: false }).limit(50),
    ]);
    let avgMin = 0;
    if (recent && recent.length) {
      const diffs = recent.map((r: any) =>
        (new Date(r.reviewed_at).getTime() - new Date(r.created_at).getTime()) / 60000,
      );
      avgMin = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
    return {
      pending: pending ?? 0,
      approvedToday: approvedToday ?? 0,
      rejectedToday: rejectedToday ?? 0,
      avgReviewMinutes: avgMin,
    };
  });

/**
 * Approve / reject / request re-submission.
 * On approve: activates subscription, generates invoice + payment record (via lifecycle),
 *   notifies customer and writes an audit log.
 * On reject: marks the order failed, notifies customer with the reason, writes audit log.
 */
export const reviewUpiSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    submissionId: string;
    action: "approve" | "reject" | "request_new";
    reasonCategory?: string;
    notes?: string;
  }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub, error } = await supabaseAdmin
      .from("manual_upi_submissions")
      .select("*, order:payment_orders(*)")
      .eq("id", data.submissionId)
      .single();
    if (error || !sub) throw new Error("Submission not found");
    await assertPlatformOrWorkspaceAdmin(context, sub.workspace_id);

    const previousStatus = sub.status as string;
    const nextStatus =
      data.action === "approve" ? "approved" :
      data.action === "reject" ? "rejected" : "pending";
    const combinedNotes = [data.reasonCategory ? `[${data.reasonCategory}]` : null, data.notes]
      .filter(Boolean).join(" ").trim() || null;

    await supabaseAdmin
      .from("manual_upi_submissions")
      .update({
        status: nextStatus,
        reviewed_by: context.userId,
        reviewed_at: data.action === "request_new" ? null : new Date().toISOString(),
        review_notes: combinedNotes,
      })
      .eq("id", data.submissionId);

    if (data.action === "approve") {
      await supabaseAdmin.from("payment_orders").update({ status: "paid" }).eq("id", sub.order_id);
      const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
      await activateFromPaidOrder({
        orderId: sub.order_id,
        gatewayPaymentId: (sub.txn_ref as string | null) ?? null,
        method: "upi",
        actorUserId: context.userId,
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: sub.submitted_by,
        workspace_id: sub.workspace_id,
        type: "billing",
        title: "Payment approved — subscription activated 🎉",
        body: "Your UPI payment was verified. Your plan is now active and your invoice is ready.",
        action_url: "/app/billing",
      } as never);
    } else if (data.action === "reject") {
      await supabaseAdmin.from("payment_orders").update({ status: "failed" }).eq("id", sub.order_id);
      const { recordFailedPayment } = await import("@/features/billing/lifecycle.server");
      await recordFailedPayment({ orderId: sub.order_id, reason: combinedNotes ?? "Manual UPI rejected" });
      await supabaseAdmin.from("notifications").insert({
        user_id: sub.submitted_by,
        workspace_id: sub.workspace_id,
        type: "billing",
        title: "Payment could not be verified",
        body: combinedNotes ?? "Please contact support or submit a new proof.",
        action_url: "/app/billing",
      } as never);
    } else {
      await supabaseAdmin.from("payment_orders").update({ status: "manual_review" }).eq("id", sub.order_id);
      await supabaseAdmin.from("notifications").insert({
        user_id: sub.submitted_by,
        workspace_id: sub.workspace_id,
        type: "billing",
        title: "Please re-upload your payment proof",
        body: combinedNotes ?? "The submitted screenshot could not be verified. Kindly upload a clearer image.",
        action_url: "/app/billing",
      } as never);
    }

    await supabaseAdmin.from("audit_logs").insert({
      workspace_id: sub.workspace_id,
      actor_id: context.userId,
      action: `manual_upi.${data.action}`,
      entity_type: "manual_upi_submission",
      entity_id: sub.id,
      metadata: {
        previous_status: previousStatus,
        new_status: nextStatus,
        reason_category: data.reasonCategory ?? null,
        notes: data.notes ?? null,
        order_id: sub.order_id,
        txn_ref: sub.txn_ref,
      },
    } as never).then(() => null, () => null);

    return { ok: true };
  });
