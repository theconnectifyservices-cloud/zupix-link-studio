import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { AnalyticsDashboard } from "@/features/analytics/components/analytics-dashboard";

function AnalyticsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Track visits, clicks, and conversions across your bio pages."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Analytics" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading analytics" />
      ) : !workspace ? (
        <EmptyState
          icon={BarChart3}
          title="No workspace found"
          description="Create or join a workspace to view analytics."
        />
      ) : (
        <AnalyticsDashboard workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/analytics")({
  component: AnalyticsRoute,
});
