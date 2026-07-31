import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { consumeAuthLink } from "@/features/auth/recovery";
import { PageLoader } from "@/shared/ui/page-loader";
import { startTejasTrial } from "@/features/trial/activation.functions";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: Callback,
});

function Callback() {
  const navigate = useNavigate();
  useEffect(() => {
    let alive = true;

    // A recovery link that lands here should finish on the reset-password screen.
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : "",
    );
    const hash = new URLSearchParams(
      typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "",
    );
    if ((params.get("type") ?? hash.get("type")) === "recovery") {
      window.location.replace(
        `/auth/reset-password${window.location.search}${window.location.hash}`,
      );
      return;
    }

    consumeAuthLink().then(async (result) => {
      if (!alive) return;
      if (result.status !== "session") {
        if (result.status === "error") toast.error(result.message);
        navigate({ to: "/auth" });
        return;
      }
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

    return () => {
      alive = false;
    };
  }, [navigate]);
  return <PageLoader />;
}
