import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BillingCycle } from "./pricing-section";

/**
 * Billing cycle state for pricing surfaces.
 *
 * Rules:
 * - Always starts on "monthly" (SSR + first client render are identical → no hydration mismatch).
 * - Guests always default to monthly; nothing is read from local storage.
 * - Signed-in users get their stored preference (user_preferences.billing_cycle) applied
 *   after mount, and any manual change is persisted for future visits.
 */
export function useBillingCycle() {
  const [cycle, setCycleState] = useState<BillingCycle>("monthly");
  const userIdRef = useRef<string | null>(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    let alive = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id ?? null;
      if (!alive || !userId) return;
      userIdRef.current = userId;

      const { data: pref } = await supabase
        .from("user_preferences")
        .select("billing_cycle")
        .eq("user_id", userId)
        .maybeSingle();

      if (!alive || touchedRef.current) return;
      if (pref?.billing_cycle === "yearly") setCycleState("yearly");
    })();

    return () => {
      alive = false;
    };
  }, []);

  const setCycle = useCallback((next: BillingCycle) => {
    touchedRef.current = true;
    setCycleState(next);
    const userId = userIdRef.current;
    if (!userId) return; // guests are never remembered
    void supabase
      .from("user_preferences")
      .upsert({ user_id: userId, billing_cycle: next }, { onConflict: "user_id" });
  }, []);

  return [cycle, setCycle] as const;
}
