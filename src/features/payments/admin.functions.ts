import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdapter } from "./gateways/registry";
import type { PaymentGatewayPrivate, PaymentGatewayPublic, PaymentProvider } from "./types";
import { redactGateway } from "./types";

const ProviderEnum = z.enum(["razorpay", "payu", "cashfree", "manual_upi"]);

async function assertAdmin(context: { supabase: any; userId: string }, workspaceId?: string | null) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (data) return true;
  if (workspaceId) {
    const { data: isWs } = await context.supabase.rpc("is_workspace_admin", {
      _user_id: context.userId,
      _workspace_id: workspaceId,
    });
    if (isWs) return true;
  }
  throw new Error("Forbidden");
}

export const listGatewaysAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId?: string | null }) => d)
  .handler(async ({ data, context }): Promise<PaymentGatewayPublic[]> => {
    await assertAdmin(context, data.workspaceId);
    const q = context.supabase
      .from("payment_gateways")
      .select("*")
      .order("priority", { ascending: true });
    const { data: rows, error } = data.workspaceId
      ? await q.eq("workspace_id", data.workspaceId)
      : await q.is("workspace_id", null);
    if (error) throw error;
    return (rows ?? []).map((r) => redactGateway(r as Record<string, unknown>));
  });

export const upsertGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      id?: string;
      workspaceId?: string | null;
      provider: PaymentProvider;
      display_name: string;
      enabled: boolean;
      mode: "sandbox" | "live";
      priority: number;
      credentials?: Record<string, string>;
      webhook_secret?: string | null;
      config?: Record<string, unknown>;
    }) => d,
  )
  .handler(async ({ data, context }): Promise<PaymentGatewayPublic> => {
    await assertAdmin(context, data.workspaceId ?? null);
    const patch: any = {
      workspace_id: data.workspaceId ?? null,
      provider: data.provider,
      display_name: data.display_name,
      enabled: data.enabled,
      mode: data.mode,
      priority: data.priority,
      config: data.config ?? {},
    };
    // Only overwrite secrets when provided (avoid wiping on edit)
    if (data.credentials && Object.keys(data.credentials).length > 0) {
      patch.credentials = data.credentials;
    }
    if (data.webhook_secret !== undefined) patch.webhook_secret = data.webhook_secret;

    const q = data.id
      ? context.supabase.from("payment_gateways").update(patch).eq("id", data.id).select("*").single()
      : context.supabase.from("payment_gateways").insert(patch).select("*").single();
    const { data: row, error } = await q;
    if (error) throw error;
    return redactGateway(row as unknown as Record<string, unknown>);
  });

export const deleteGateway = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; workspaceId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context, data.workspaceId ?? null);
    const { error } = await context.supabase.from("payment_gateways").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const testGatewayConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    // Load with admin client so credentials are readable
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Gateway not found");
    await assertAdmin(context, row.workspace_id);

    const adapter = getAdapter(row.provider as PaymentProvider);
    const result = await adapter.health(row as PaymentGatewayPrivate);
    await supabaseAdmin
      .from("payment_gateways")
      .update({
        health_status: result.status,
        health_message: result.message,
        health_checked_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    return result;
  });
