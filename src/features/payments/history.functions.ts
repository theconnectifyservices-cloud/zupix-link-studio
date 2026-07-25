import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { JsonValue } from "./types";

export interface PaymentHistoryRow {
  id: string;
  created_at: string;
  amount_paise: number;
  currency: string;
  status: string;
  provider: string;
  provider_order_id: string | null;
  plan_id: string | null;
  meta: Record<string, JsonValue>;
}

export const listPaymentHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data, context }): Promise<PaymentHistoryRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("payment_orders")
      .select("id, created_at, amount_paise, currency, status, provider, provider_order_id, plan_id, meta")
      .eq("workspace_id", data.workspaceId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (rows ?? []).map((r) => ({
      ...r,
      meta: (r.meta as Record<string, JsonValue>) ?? {},
    })) as PaymentHistoryRow[];
  });

