import { createFileRoute } from "@tanstack/react-router";
import { Target } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { ConversionDashboard } from "@/features/conversions";

function ConversionsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Conversions"
        description="Define goals, measure results, and optimize your CTAs."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Conversions" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading conversions" />
      ) : !workspace ? (
        <EmptyState
          icon={<Target className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to track conversions."
        />
      ) : (
        <ConversionDashboard workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/conversions")({
  component: ConversionsRoute,
});
