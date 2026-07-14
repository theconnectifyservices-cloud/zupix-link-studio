import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/features/auth/hooks/use-session";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/app/settings/sessions")({
  component: SessionsSettings,
});

function SessionsSettings() {
  const session = useSession();
  const navigate = useNavigate();

  async function signOutEverywhere() {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Signed out of all devices");
    navigate({ to: "/auth" });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <p className="font-medium">Current session</p>
        <p className="text-sm text-muted-foreground">
          Signed in as{" "}
          <span className="font-medium text-foreground">
            {session.status === "authenticated" ? session.session.user.email : "—"}
          </span>
        </p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="font-medium">Sign out of all devices</p>
        <p className="mb-3 text-sm text-muted-foreground">
          This will end all active sessions on every device.
        </p>
        <Button variant="destructive" onClick={signOutEverywhere}>
          Sign out everywhere
        </Button>
      </div>
    </div>
  );
}
