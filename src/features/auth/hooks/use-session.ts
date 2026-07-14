import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type SessionState =
  | { status: "loading"; session: null }
  | { status: "authenticated"; session: Session }
  | { status: "unauthenticated"; session: null };

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: "loading", session: null });

  useEffect(() => {
    let alive = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setState(
        session
          ? { status: "authenticated", session }
          : { status: "unauthenticated", session: null },
      );
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setState(
        data.session
          ? { status: "authenticated", session: data.session }
          : { status: "unauthenticated", session: null },
      );
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
