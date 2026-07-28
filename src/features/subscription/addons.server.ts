/**
 * Bio Link add-on crediting (SERVER-ONLY).
 *
 * A paid `payment_orders` row whose `meta.kind === 'bio_link_addon'` grants
 * extra Bio Links to the workspace instead of activating a subscription.
 * Idempotent: the order id is recorded in the workspace add-on metadata.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { BIO_LINK_ADDON_CODE } from "./plans";

export const BIO_LINK_ADDON_ORDER_KIND = "bio_link_addon";

export async function getBioLinkAddonRow() {
  const { data, error } = await supabaseAdmin
    .from("addons")
    .select("id, code, name, price_minor, currency, quantity_per_unit, metric_key")
    .eq("code", BIO_LINK_ADDON_CODE)
    .maybeSingle();
  if (error || !data) throw new Error("Bio Link add-on is not configured");
  return data;
}

/** Grant `quantity` extra Bio Links to a workspace. Returns the new total. */
export async function grantBioLinkAddons(input: {
  workspaceId: string;
  quantity: number;
  gateway?: string | null;
  gatewayReference?: string | null;
  source: string;
  actorUserId?: string | null;
  orderId?: string | null;
}): Promise<number> {
  const addon = await getBioLinkAddonRow();

  const { data: rows } = await supabaseAdmin
    .from("workspace_addons")
    .select("id, quantity, metadata")
    .eq("workspace_id", input.workspaceId)
    .eq("addon_id", addon.id)
    .eq("status", "active");

  const existing = (rows ?? [])[0] as
    | { id: string; quantity: number; metadata: Record<string, unknown> | null }
    | undefined;

  // Idempotency — same order already credited
  if (input.orderId && existing) {
    const orders = ((existing.metadata?.orders as string[] | undefined) ?? []);
    if (orders.includes(input.orderId)) return existing.quantity;
  }

  const nextQty = Math.max(0, (existing?.quantity ?? 0) + input.quantity);
  const metadata = {
    ...(existing?.metadata ?? {}),
    source: input.source,
    orders: [
      ...(((existing?.metadata?.orders as string[] | undefined) ?? [])),
      ...(input.orderId ? [input.orderId] : []),
    ],
    last_actor: input.actorUserId ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabaseAdmin
      .from("workspace_addons")
      .update({
        quantity: nextQty,
        gateway: input.gateway ?? null,
        gateway_reference: input.gatewayReference ?? null,
        metadata: metadata as never,
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("workspace_addons").insert({
      workspace_id: input.workspaceId,
      addon_id: addon.id,
      quantity: nextQty,
      status: "active",
      gateway: input.gateway ?? null,
      gateway_reference: input.gatewayReference ?? null,
      metadata: metadata as never,
    } as never);
  }

  return nextQty;
}

/** Credit add-ons from a paid order. Used by the payment lifecycle. */
export async function creditBioLinkAddonFromOrder(order: {
  id: string;
  workspace_id: string;
  provider?: string | null;
  meta?: Record<string, unknown> | null;
}): Promise<{ ok: true; quantity: number; total: number }> {
  const meta = order.meta ?? {};
  const quantity = Math.max(1, Number(meta.addon_quantity ?? 1));
  const total = await grantBioLinkAddons({
    workspaceId: order.workspace_id,
    quantity,
    gateway: order.provider ?? null,
    gatewayReference: order.id,
    source: "purchase",
    orderId: order.id,
  });

  try {
    await supabaseAdmin.from("billing_events").insert({
      workspace_id: order.workspace_id,
      event_type: "addon.bio_link.purchased",
      metadata: { order_id: order.id, quantity, total } as never,
    } as never);
  } catch {
    /* non-fatal */
  }

  return { ok: true, quantity, total };
}
