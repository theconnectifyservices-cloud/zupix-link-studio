import { createFileRoute } from "@tanstack/react-router";
import { Radio } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { CommunicationCenter } from "@/features/communications";

function CommunicationsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Communication Center"
        description="Connect messaging services, email providers, and notification channels for this workspace."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Communications" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading Communication Center" />
      ) : !workspace ? (
        <EmptyState
          icon={<Radio className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to configure communications."
        />
      ) : (
        <CommunicationCenter workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/communications")({
  component: CommunicationsRoute,
});
