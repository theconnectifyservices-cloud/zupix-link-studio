import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { WorkspaceManager } from "@/features/workspace";

function TeamPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();

  if (isLoading || session.status === "loading") return <PageLoader label="Loading workspace" />;
  if (!workspace || session.status !== "authenticated") {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No workspace"
        description="Create a workspace to start collaborating."
      />
    );
  }
  return (
    <div>
      <PageHeader
        title="Workspace"
        description="Members, roles, permissions and audit log — everything about your team."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Workspace" }]}
      />
      <WorkspaceManager workspace={workspace as never} userId={session.session.user.id} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/team")({
  component: TeamPage,
});
