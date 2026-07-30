import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { REGISTRY_META } from "./gateways/meta";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGatewayPrivate,
  PaymentGatewayPublic,
  PaymentProvider,
} from "./types";
import { redactGateway } from "./types";

/** Smart selector: returns only enabled gateways, sorted by priority. */
const PROVIDER_PRIORITY: Record<PaymentProvider, number> = {
  razorpay: 1,
  payu: 2,
  cashfree: 3,
  manual_upi: 4,
};

export const listAvailableGateways = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data }): Promise<PaymentGatewayPublic[]> => {
    // Read via admin client: RLS on payment_gateways restricts global
    // (workspace_id IS NULL) rows to platform admins, but every workspace
    // member paying through the checkout needs to see which enabled
    // gateways exist. Credentials/webhook_secret are stripped by
    // redactGateway before the payload leaves the server.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("enabled", true)
      .or(`workspace_id.eq.${data.workspaceId},workspace_id.is.null`);
    if (error) {
      console.error("[checkout] gateway resolution failed", error);
      throw error;
    }
    console.log(`[checkout] gateway resolution ws=${data.workspaceId} candidates=${rows?.length ?? 0}`);

    // Workspace override wins over global; skip unhealthy ("down") gateways.
    const byProvider = new Map<string, PaymentGatewayPrivate>();
    for (const r of rows ?? []) {
      const priv = r as unknown as PaymentGatewayPrivate;
      if (priv.health_status === "down") {
        console.log(`[checkout] skip ${priv.provider} id=${priv.id} reason=health_down`);
        continue;
      }
      const existing = byProvider.get(priv.provider);
      if (!existing || (existing.workspace_id === null && priv.workspace_id !== null)) {
        byProvider.set(priv.provider, priv);
      }
    }
    const out = [...byProvider.values()]
      .sort((a, b) => {
        const pa = PROVIDER_PRIORITY[a.provider] ?? 99;
        const pb = PROVIDER_PRIORITY[b.provider] ?? 99;
        if (pa !== pb) return pa - pb;
        return (a.priority ?? 100) - (b.priority ?? 100);
      })
      .map((r) => redactGateway(r as unknown as Record<string, unknown>));
    console.log(`[checkout] gateway selected order=${out.map((g) => g.provider).join(",")}`);
    return out;
  });

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      planId: string;
      gatewayId: string;
      cycle: "monthly" | "quarterly" | "yearly" | "lifetime";
      amountPaise: number;
      currency: string;
      customer: { name: string; email: string; phone?: string };
      returnUrl: string;
      meta?: Record<string, unknown>;
    }) => d,
  )
  .handler(async ({ data, context }): Promise<CreateOrderResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gw, error: gErr } = await supabaseAdmin
      .from("payment_gateways")
      .select("*")
      .eq("id", data.gatewayId)
      .eq("enabled", true)
      .single();
    if (gErr || !gw) throw new Error("Gateway not available");

    const idempotencyKey = `${data.workspaceId}:${data.planId}:${data.cycle}:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
    const { data: order, error: oErr } = await context.supabase
      .from("payment_orders")
      .insert({
        workspace_id: data.workspaceId,
        user_id: context.userId,
        plan_id: data.planId,
        gateway_id: gw.id,
        provider: gw.provider,
        amount_paise: data.amountPaise,
        currency: data.currency,
        idempotency_key: idempotencyKey,
        status: "created",
        meta: { cycle: data.cycle, customer: data.customer, ...(data.meta ?? {}) } as any,
      })
      .select("*")
      .single();
    if (oErr || !order) throw oErr ?? new Error("Order not created");


    const { getAdapter } = await import("./gateways/registry");
    const adapter = getAdapter(gw.provider as PaymentProvider);
    const input: CreateOrderInput = {
      workspaceId: data.workspaceId,
      planId: data.planId,
      cycle: data.cycle,
      amountPaise: data.amountPaise,
      currency: data.currency,
      customer: data.customer,
      returnUrl: data.returnUrl,
    };
    let result: CreateOrderResult;
    try {
      result = await adapter.createOrder(gw as PaymentGatewayPrivate, input, order.id);
    } catch (e) {
      const prevMeta = (order.meta as Record<string, unknown> | null) ?? {};
      await supabaseAdmin
        .from("payment_orders")
        .update({ status: "failed", meta: { ...prevMeta, error: (e as Error).message } })
        .eq("id", order.id);
      throw e;
    }


    // Store provider order id for reconciliation
    const providerOrderId =
      result.launch.kind === "razorpay"
        ? result.launch.orderId
        : result.launch.kind === "cashfree"
          ? result.launch.sessionId
          : result.launch.kind === "payu"
            ? result.launch.fields.txnid
            : order.id;
    await supabaseAdmin
      .from("payment_orders")
      .update({ provider_order_id: providerOrderId, status: "pending" })
      .eq("id", order.id);

    return { ...result, orderId: order.id };
  });

export const gatewayMeta = () => REGISTRY_META;
