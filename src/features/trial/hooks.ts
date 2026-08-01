/**
 * Trial-engine hooks: useTrial, useTrialCountdown, useCoupons, useUpgrade,
 * useFeatureLock. Thin wrappers over api.ts + subscription store.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSubscriptionUI } from "@/features/subscription/store";
import { useFeature, usePlan } from "@/features/subscription/hooks";
import type { FeatureKey } from "@/features/subscription/plans";
import {
  archiveCoupon,
  deleteCoupon,
  fetchTrialInfo,
  listCoupons,
  upsertCoupon,
  validateCoupon,
  type CouponRow,
} from "./api";

export function useTrial() {
  const { workspace } = useCurrentWorkspace();
  const workspaceId = workspace?.id ?? null;
  return useQuery({
    queryKey: ["trial", workspaceId],
    queryFn: () => fetchTrialInfo(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  expired: boolean;
}

export function useTrialCountdown() {
  const { data } = useTrial();
  const end = data?.trialEnd ? new Date(data.trialEnd).getTime() : null;
  // Clock reads must not run during SSR/first render or the hydrated markup
  // differs from the server output (React #418).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!end) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);
  if (!end || !data?.isTrialing) return null;
  const totalMs = Math.max(0, end - (now ?? end));

  const s = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    totalMs,
    expired: now !== null && totalMs === 0,
  } satisfies Countdown;
}

export function useUpgrade() {
  const openUpgrade = useSubscriptionUI((s) => s.openUpgrade);
  return { openUpgrade };
}

export function useFeatureLock(feature: FeatureKey) {
  return useFeature(feature);
}

export function useCurrentPlanCode() {
  const { code } = usePlan();
  return code;
}

export function useCoupons() {
  return useQuery({ queryKey: ["coupons"], queryFn: listCoupons, staleTime: 30_000 });
}

export function useCouponMutations() {
  const qc = useQueryClient();
  const upsert = useMutation({
    mutationFn: (row: Partial<CouponRow> & { code: string; kind: "percentage" | "flat" }) => upsertCoupon(row),
    onSuccess: () => {
      toast.success("Coupon saved");
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const archive = useMutation({
    mutationFn: (v: { id: string; archived: boolean }) => archiveCoupon(v.id, v.archived),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("Coupon deleted");
      qc.invalidateQueries({ queryKey: ["coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return { upsert, archive, remove };
}

export function useValidateCoupon() {
  const { workspace } = useCurrentWorkspace();
  return useMutation({
    mutationFn: (v: { code: string; planCode: string; cycle: string; amountMinor: number }) => {
      if (!workspace) throw new Error("No workspace");
      return validateCoupon(v.code, workspace.id, v.planCode, v.cycle, v.amountMinor);
    },
  });
}
