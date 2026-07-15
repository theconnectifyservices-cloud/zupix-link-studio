/**
 * LS-13E — Monetization React hooks with in-memory caching for entitlement checks.
 */
import { useCallback, useEffect, useState } from "react";
import { checkFeature, getCreditBalance, listUsageCounters } from "./api";
import type { UsageCounter } from "./types";

// simple TTL cache for feature checks (60s)
const featureCache = new Map<string, { value: boolean; expires: number }>();
const TTL_MS = 60_000;

export function useFeatureFlag(workspaceId: string | null | undefined, featureKey: string) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    const cacheKey = `${workspaceId}:${featureKey}`;
    const cached = featureCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      setEnabled(cached.value);
      return;
    }
    setLoading(true);
    checkFeature(workspaceId, featureKey)
      .then((v) => {
        featureCache.set(cacheKey, { value: v, expires: Date.now() + TTL_MS });
        setEnabled(v);
      })
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, [workspaceId, featureKey]);

  return { enabled, loading };
}

export function invalidateFeatureCache() {
  featureCache.clear();
}

export function useCreditBalance(workspaceId: string | null | undefined, creditType: string) {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      setBalance(await getCreditBalance(workspaceId, creditType));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, creditType]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { balance, loading, refresh };
}

export function useUsageCounters(workspaceId: string | null | undefined) {
  const [counters, setCounters] = useState<UsageCounter[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      setCounters(await listUsageCounters(workspaceId));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { counters, loading, refresh };
}
