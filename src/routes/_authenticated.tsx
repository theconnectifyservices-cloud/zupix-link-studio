import { createFileRoute, redirect, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { PageLoader } from "@/shared/ui/page-loader";
import { UpgradeModal } from "@/features/subscription";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
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
    // Force a password change after an admin reset / temporary password.
    if (
      session.status === "authenticated" &&
      profile &&
      (profile as { force_password_change?: boolean }).force_password_change &&
      !window.location.pathname.startsWith("/app/settings/password")
    ) {
      navigate({ to: "/app/settings/password" });
    }
  }, [session.status, profile, navigate]);

  useEffect(() => {
    // Redirect to onboarding if incomplete
    if (
      session.status === "authenticated" &&
      profile &&
      !profile.onboarding_completed &&
      !window.location.pathname.startsWith("/onboarding")
    ) {
      navigate({ to: "/onboarding" });
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
