import { createFileRoute } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { AutomationCenter } from "@/features/automation";

function AutomationRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  return (
    <div>
      <PageHeader
        title="Automation Platform"
        description="API keys, webhooks, delivery logs and developer documentation for this workspace."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Automation" }]}
      />
      {isLoading || !userId ? (
        <PageLoader label="Loading automation platform" />
      ) : !workspace ? (
        <EmptyState
          icon={<Zap className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to configure automation."
        />
      ) : (
        <AutomationCenter workspaceId={workspace.id} userId={userId} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/automation")({
  component: AutomationRoute,
});
