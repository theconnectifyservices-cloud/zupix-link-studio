import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { GrowthCoach } from "@/features/ai/growth-coach/growth-coach";

function AiGrowthPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  if (isLoading) return <PageLoader label="Loading Growth Coach" />;
  if (!workspace)
    return (
      <EmptyState
        icon={<TrendingUp className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to use the AI Growth Coach."
      />
    );
  return (
    <div>
      <PageHeader
        title="AI Growth Coach"
        description="Score every dimension of your bio, then act on prioritized AI recommendations."
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "AI", href: "/app/ai" },
          { label: "Growth Coach" },
        ]}
      />
      <GrowthCoach workspaceId={workspace.id} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/ai/growth")({
  component: AiGrowthPage,
});
