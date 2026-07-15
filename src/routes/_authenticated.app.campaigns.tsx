import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { CampaignsDashboard } from "@/features/campaigns";

function CampaignsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Campaigns"
        description="Track UTMs, attribute traffic and measure marketing performance."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Campaigns" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading campaigns" />
      ) : !workspace ? (
        <EmptyState
          icon={<Megaphone className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to manage campaigns."
        />
      ) : (
        <CampaignsDashboard workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/campaigns")({
  component: CampaignsRoute,
});
