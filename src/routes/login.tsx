import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    // Only check session on the client — server has no cookie for the SPA Supabase client.
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/app" });
    }
    throw redirect({ to: "/auth", search: { mode: "login" } });
  },
});
