import { createFileRoute } from "@tanstack/react-router";
import { Workflow } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { ActionCenter } from "@/features/ai/workflows/action-center";

function AiWorkflowsPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();

  if (isLoading || session.status === "loading") {
    return <PageLoader label="Loading Action Center" />;
  }
  if (!workspace || session.status !== "authenticated") {
    return (
      <EmptyState
        icon={<Workflow className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to run AI workflows."
      />
    );
  }
  return (
    <div>
      <PageHeader
        title="AI Action Center"
        description="Trigger AI workflows, review previews, approve or undo — all draft-only, permission-aware, and audited."
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "AI", href: "/app/ai" },
          { label: "Workflows" },
        ]}
      />
      <ActionCenter workspaceId={workspace.id} userId={session.session.user.id} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/ai/workflows")({
  component: AiWorkflowsPage,
});
