import { createFileRoute } from "@tanstack/react-router";
import { Radar } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { TrackingCenter } from "@/features/tracking";

function TrackingRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Tracking Center"
        description="Manage analytics, marketing pixels and custom scripts for every bio page in this workspace."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Tracking Center" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading tracking settings" />
      ) : !workspace ? (
        <EmptyState
          icon={<Radar className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to configure tracking."
        />
      ) : (
        <TrackingCenter workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/tracking")({
  component: TrackingRoute,
});
