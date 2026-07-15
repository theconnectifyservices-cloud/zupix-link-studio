import { useEffect } from "react";
import { runSecurityScan } from "./checks";
import { useFindingsStore } from "./findings.store";
import { useAuditLogStore } from "./audit-log.store";

/**
 * Runs a client-side security scan on mount, refreshes findings and
 * subscribes to auth events for audit-log coverage.
 */
export function SecurityInstall() {
  const setAll = useFindingsStore((s) => s.setAll);
  const log = useAuditLogStore((s) => s.log);

  useEffect(() => {
    setAll(runSecurityScan());

    let unsub: (() => void) | undefined;
    import("@/integrations/supabase/client")
      .then(({ supabase }) => {
        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          if (
            event === "SIGNED_IN" ||
            event === "SIGNED_OUT" ||
            event === "TOKEN_REFRESHED" ||
            event === "PASSWORD_RECOVERY" ||
            event === "USER_UPDATED"
          ) {
            log({
              category: "auth",
              action: event,
              actor: session?.user?.email ?? session?.user?.id ?? null,
            });
          }
        });
        unsub = () => data.subscription.unsubscribe();
      })
      .catch(() => undefined);

    return () => unsub?.();
  }, [setAll, log]);

  return null;
}
