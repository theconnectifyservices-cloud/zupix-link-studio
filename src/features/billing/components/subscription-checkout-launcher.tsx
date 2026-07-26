/**
 * Bridge between the subscription flow (plan + cycle) and the multi-gateway
 * payments CheckoutModal. Resolves plan_id + price then hands off.
 */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckoutModal } from "@/features/payments/components/checkout-modal";
import { useResolveCheckout } from "../hooks";

type Cycle = "monthly" | "quarterly" | "yearly" | "lifetime";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  workspaceName: string;
  planCode: string;
  cycle: Cycle;
}

export function SubscriptionCheckoutLauncher({
  open,
  onOpenChange,
  workspaceId,
  planCode,
  cycle,
}: Props) {
  const qc = useQueryClient();
  const resolve = useResolveCheckout();
  const [resolved, setResolved] = useState<{
    planId: string;
    planName: string;
    amountPaise: number;
    currency: string;
  } | null>(null);
  const [customer, setCustomer] = useState<{ name: string; email: string; phone?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const [{ data: userRes }, r] = await Promise.all([
        supabase.auth.getUser(),
        resolve.mutateAsync({ workspaceId, planCode, cycle }),
      ]);
      if (cancelled) return;
      setResolved(r);
      const email = userRes.user?.email ?? "";
      const name =
        (userRes.user?.user_metadata as { full_name?: string; name?: string } | null)?.full_name
        ?? (userRes.user?.user_metadata as { name?: string } | null)?.name
        ?? email.split("@")[0]
        ?? "Customer";
      setCustomer({ name, email });
    })().catch(() => onOpenChange(false));
    return () => { cancelled = true; };
  }, [open, workspaceId, planCode, cycle]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !resolved || !customer) return null;

  return (
    <CheckoutModal
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          qc.invalidateQueries({ queryKey: ["billing"] });
          qc.invalidateQueries({ queryKey: ["subscription"] });
        }
      }}
      workspaceId={workspaceId}
      planId={resolved.planId}
      planLabel={`${resolved.planName} · ${cycle}`}
      cycle={cycle}
      amountPaise={resolved.amountPaise}
      currency={resolved.currency}
      customer={customer}
    />
  );
}
