import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { DesignStudio } from "@/features/ai/design-studio";

function AiDesignStudioPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;

  if (isLoading || !userId) return <PageLoader label="Loading Design Studio" />;
  if (!workspace)
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to use the AI Design Studio."
      />
    );

  return (
    <div>
      <PageHeader
        title="AI Design Studio"
        description="Analyze any bio page and get data-driven, one-click design improvements."
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "AI", href: "/app/ai" },
          { label: "Design Studio" },
        ]}
      />
      <DesignStudio workspaceId={workspace.id} userId={userId} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/ai/design")({
  component: AiDesignStudioPage,
});
