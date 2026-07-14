import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@/features/auth/hooks/use-session";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/settings/security")({
  component: SecuritySettings,
});

function SecuritySettings() {
  const session = useSession();
  const user = session.status === "authenticated" ? session.session.user : null;
  const verified = !!user?.email_confirmed_at || !!user?.confirmed_at;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-start gap-3">
          {verified ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
          ) : (
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
          )}
          <div>
            <p className="font-medium">Email verification</p>
            <p className="text-sm text-muted-foreground">
              {verified
                ? "Your email is verified."
                : "Check your inbox to verify your email address."}
            </p>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <p className="font-medium">Two-factor authentication</p>
        <p className="text-sm text-muted-foreground">Coming in a future phase — foundation only.</p>
      </div>
    </div>
  );
}
