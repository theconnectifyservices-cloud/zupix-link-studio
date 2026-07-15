import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { AgencyDashboard } from "@/features/agency";

function AgencyPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();

  if (isLoading || session.status === "loading") return <PageLoader label="Loading agency" />;
  if (!workspace || session.status !== "authenticated") {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="No workspace"
        description="Create or switch to an agency workspace to manage clients."
      />
    );
  }
  return (
    <div>
      <PageHeader
        title="Agency"
        description="Manage clients, teams, approvals and shared resources — from one operating system."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Agency" }]}
      />
      <AgencyDashboard agencyId={workspace.id} userId={session.session.user.id} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/agency")({
  component: AgencyPage,
});
