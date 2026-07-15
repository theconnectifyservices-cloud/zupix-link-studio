import { createFileRoute } from "@tanstack/react-router";
import { MonetizationCenter } from "@/features/monetization";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";

export const Route = createFileRoute("/_authenticated/app/monetization")({
  component: MonetizationPage,
});

function MonetizationPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  if (isLoading) return <PageLoader />;
  if (!workspace) return <EmptyState title="No workspace" description="Create or join a workspace to manage monetization." />;
  return <MonetizationCenter workspaceId={workspace.id} workspaceName={workspace.name} />;
}
