/**
 * Trial activation server function — idempotently starts a 3-day Tejas
 * trial for the caller's active workspace. Safe to call after any
 * successful sign-in / sign-up.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface StartTrialResult {
  ok: boolean;
  already?: boolean;
  reason?: string;
  subscriptionId?: string | null;
  trialEnd?: string | null;
}

export const startTejasTrial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }): Promise<StartTrialResult> => {
    const supabase = context.supabase as any;

    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      // Ensure/resolve the caller's active workspace via existing helper.
      const { data: ws, error } = await supabase.rpc("ensure_personal_workspace");
      if (error) throw error;
      workspaceId = (ws as { id?: string } | null)?.id ?? null;
    }
    if (!workspaceId) return { ok: false, reason: "no_workspace" };

    const { data: res, error: rpcErr } = await supabase.rpc("ensure_tejas_trial", {
      _workspace_id: workspaceId,
    });
    if (rpcErr) throw rpcErr;
    const r = (res ?? {}) as Record<string, unknown>;
    return {
      ok: Boolean(r.ok),
      already: Boolean(r.already),
      reason: (r.reason as string | undefined) ?? undefined,
      subscriptionId: (r.subscription_id as string | undefined) ?? null,
      trialEnd: (r.trial_end as string | undefined) ?? null,
    };
  });
