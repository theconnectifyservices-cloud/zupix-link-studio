import { createFileRoute, redirect, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { PageLoader } from "@/shared/ui/page-loader";
import { UpgradeModal } from "@/features/subscription";
import { resolvePostAuthTarget } from "@/features/auth/post-auth-target";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        // Never bounce users back into settings/profile/password screens.
        to: "/auth",
        search: { redirect: resolvePostAuthTarget(location.pathname + location.searchStr) },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const session = useSession();
  const navigate = useNavigate();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile, isLoading } = useProfile(userId);

  useEffect(() => {
    if (session.status === "unauthenticated") {
      navigate({ to: "/auth" });
    }
  }, [session.status, navigate]);

  useEffect(() => {
    // Force a password change ONLY while an admin-issued temporary password is
    // still pending. A stale flag must never hijack normal dashboard entry.
    if (session.status !== "authenticated" || !profile) return;
    const p = profile as { force_password_change?: boolean; temp_password_expires_at?: string | null };
    const tempActive =
      !!p.temp_password_expires_at && new Date(p.temp_password_expires_at).getTime() > Date.now();
    if (
      p.force_password_change &&
      tempActive &&
      !window.location.pathname.startsWith("/app/settings/password")
    ) {
      navigate({ to: "/app/settings/password", replace: true });
    }
  }, [session.status, profile, navigate]);

  useEffect(() => {
    // Redirect to onboarding if no workspace has been set up yet.
    if (
      session.status === "authenticated" &&
      profile &&
      !profile.onboarding_completed &&
      !window.location.pathname.startsWith("/onboarding")
    ) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [session.status, profile, navigate]);



  if (session.status === "loading" || (userId && isLoading)) {
    return <PageLoader />;
  }

  return (
    <>
      <Outlet />
      <UpgradeModal />
    </>
  );
}
