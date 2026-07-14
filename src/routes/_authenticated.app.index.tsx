import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Settings2, User } from "lucide-react";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Overview,
});

function Overview() {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Phase LS-02 · Authentication ready
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your account and workspace are set up. Business features arrive in later phases.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your handle</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              zupix.link/{profile?.username ?? "—"}
            </div>
            <CardDescription className="mt-1">
              Your public bio link (available after Phase LS-03).
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account settings</CardTitle>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link
              to="/app/settings/profile"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Manage your profile <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
