import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageLoader } from "@/shared/ui/page-loader";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    // Session is set by Supabase from URL fragment automatically
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/app" });
      } else {
        navigate({ to: "/auth" });
      }
    });
  }, [navigate]);
  return <PageLoader />;
}
