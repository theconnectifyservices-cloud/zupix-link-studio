import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/shared/ui/page-loader";
import { startTejasTrial } from "@/features/trial/activation.functions";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
        return;
      }
      // Idempotently ensure a Tejas trial exists (safe no-op if user already has a sub).
      try {
        await startTejasTrial({ data: {} });
      } catch {
        /* non-fatal — trigger + backfill also cover this */
      }
      const intent =
        typeof window !== "undefined" ? window.sessionStorage.getItem("zupix:auth_intent") : null;
      if (intent && typeof window !== "undefined") {
        window.sessionStorage.removeItem("zupix:auth_intent");
      }
      navigate({ to: intent === "trial" ? "/app/my-subscription" : "/app" });
    });
  }, [navigate]);
  return <PageLoader />;
}
