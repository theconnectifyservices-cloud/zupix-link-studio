import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

export const listPendingUpiSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("manual_upi_submissions")
      .select("*, order:payment_orders(id, amount_paise, currency, plan_id)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const reviewUpiSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { submissionId: string; approve: boolean; notes?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: sub, error } = await context.supabase
      .from("manual_upi_submissions")
      .select("*, order:payment_orders(*)")
      .eq("id", data.submissionId)
      .single();
    if (error || !sub) throw new Error("Not found");
    const { data: isAdmin } = await context.supabase.rpc("is_workspace_admin", {
      _user_id: context.userId,
      _workspace_id: sub.workspace_id,
    });
    if (!isAdmin) throw new Error("Forbidden");

    const nextStatus = data.approve ? "approved" : "rejected";
    await context.supabase
      .from("manual_upi_submissions")
      .update({
        status: nextStatus,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes,
      })
      .eq("id", data.submissionId);

    await context.supabase
      .from("payment_orders")
      .update({ status: data.approve ? "paid" : "failed" })
      .eq("id", sub.order_id);

    if (data.approve) {
      const { activateFromPaidOrder } = await import("@/features/billing/lifecycle.server");
      await activateFromPaidOrder({
        orderId: sub.order_id,
        gatewayPaymentId: (sub.txn_ref as string | null) ?? null,
        method: "upi",
        actorUserId: context.userId,
      });
    } else {
      const { recordFailedPayment } = await import("@/features/billing/lifecycle.server");
      await recordFailedPayment({ orderId: sub.order_id, reason: data.notes ?? "Manual UPI rejected" });
    }

    return { ok: true };
  });
