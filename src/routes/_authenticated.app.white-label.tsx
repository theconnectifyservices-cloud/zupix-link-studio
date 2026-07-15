import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSession } from "@/features/auth/hooks/use-session";
import { WhiteLabelDashboard } from "@/features/white-label";

function WhiteLabelPage() {
  const session = useSession();
  if (session.status === "loading") return <PageLoader label="Loading white label" />;
  if (session.status !== "authenticated") {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Sign in required"
        description="Sign in to manage partner tenants."
      />
    );
  }
  return <WhiteLabelDashboard userId={session.session.user.id} />;
}

export const Route = createFileRoute("/_authenticated/app/white-label")({
  component: WhiteLabelPage,
});
