import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { acceptInvitation } from "@/features/workspace/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ready" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (!data.session) {
        navigate({ to: "/auth", search: { redirect: `/invite/${token}` } as never });
        return;
      }
      setState("ready");
    })();
    return () => {
      alive = false;
    };
  }, [token, navigate]);

  const accept = async () => {
    try {
      setState("loading");
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("Not signed in");
      await acceptInvitation(token, data.user.id);
      setState("success");
      setTimeout(() => navigate({ to: "/app/team" }), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setState("error");
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace invitation</CardTitle>
          <CardDescription>You've been invited to join a workspace on ZUPIX.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {state === "loading" && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {state === "ready" && (
            <Button className="w-full" onClick={accept}>
              Accept invitation
            </Button>
          )}
          {state === "success" && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="h-5 w-5" /> Joined! Redirecting…
            </div>
          )}
          {state === "error" && (
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                {error}
                <div>
                  <Button variant="link" className="px-0" onClick={() => setState("ready")}>
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
