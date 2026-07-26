/**
 * Billing hooks — thin wrappers over server functions + Supabase reads.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  cancelSubscription,
  getWorkspaceSubscription,
  listInvoices,
  listPayments,
} from "./api";
import { mockActivateSubscription, resolveSubscriptionCheckout } from "./subscription-checkout.functions";

export function useWorkspaceSubscription(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ["billing", "subscription", workspaceId],
    queryFn: () => getWorkspaceSubscription(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useInvoices(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ["billing", "invoices", workspaceId],
    queryFn: () => listInvoices(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function usePayments(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: ["billing", "payments", workspaceId],
    queryFn: () => listPayments(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useResolveCheckout() {
  const fn = useServerFn(resolveSubscriptionCheckout);
  return useMutation({
    mutationFn: (v: { workspaceId: string; planCode: string; cycle: "monthly" | "quarterly" | "yearly" | "lifetime" }) =>
      fn({ data: v }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMockActivate(workspaceId: string) {
  const qc = useQueryClient();
  const fn = useServerFn(mockActivateSubscription);
  return useMutation({
    mutationFn: (v: { planCode: string; cycle: "monthly" | "quarterly" | "yearly" | "lifetime" }) =>
      fn({ data: { workspaceId, ...v } }),
    onSuccess: async () => {
      toast.success("Subscription activated (test mode)");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] }),
        qc.invalidateQueries({ queryKey: ["billing", "invoices", workspaceId] }),
        qc.invalidateQueries({ queryKey: ["billing", "payments", workspaceId] }),
        qc.invalidateQueries({ queryKey: ["subscription"] }),
      ]);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelSubscription(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { subscriptionId: string; atPeriodEnd: boolean }) =>
      cancelSubscription(v.subscriptionId, v.atPeriodEnd),
    onSuccess: () => {
      toast.success("Cancellation scheduled");
      qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReactivateSubscription(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("billing_subscriptions")
        .update({ cancel_at_period_end: false, canceled_at: null } as never)
        .eq("id", subscriptionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Subscription reactivated");
      qc.invalidateQueries({ queryKey: ["billing", "subscription", workspaceId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
