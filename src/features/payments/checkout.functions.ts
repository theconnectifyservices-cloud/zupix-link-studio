import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdapter, REGISTRY_META } from "./gateways/registry";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentGatewayPrivate,
  PaymentGatewayPublic,
  PaymentProvider,
} from "./types";
import { redactGateway } from "./types";

/** Smart selector: returns only enabled gateways, sorted by priority. */
export const listAvailableGateways = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data, context }): Promise<PaymentGatewayPublic[]> => {
    // Prefer workspace-scoped, fall back to global (workspace_id IS NULL)
    const { data: rows, error } = await context.supabase
      .from("payment_gateways")
      .select("*")
      .eq("enabled", true)
      .or(`workspace_id.eq.${data.workspaceId},workspace_id.is.null`)
      .order("priority", { ascending: true });
    if (error) throw error;
    // Dedupe: workspace override wins over global for same provider
    const seen = new Set<string>();
    const out: PaymentGatewayPublic[] = [];
    for (const r of rows ?? []) {
      const priv = r as unknown as PaymentGatewayPrivate;
      const key = priv.provider;
      if (seen.has(key)) continue;
      if (priv.health_status === "down") continue;
      seen.add(key);
      out.push(redactGateway(r as Record<string, unknown>));

    }
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
        meta: { cycle: data.cycle, customer: data.customer } as any,
      })
      .select("*")
      .single();
    if (oErr || !order) throw oErr ?? new Error("Order not created");


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
