import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { ContentStudio } from "@/features/ai/content-studio";

function AiContentStudioPage() {
  const { workspace, isLoading } = useCurrentWorkspace();
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;

  if (isLoading || !userId) return <PageLoader label="Loading AI Content Studio" />;
  if (!workspace)
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to use the AI Content Studio."
      />
    );

  return (
    <div>
      <PageHeader
        title="AI Content Studio"
        description="Generate bios, CTAs, social content, SEO, and buttons — brand-aware, on-demand."
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "AI", href: "/app/ai" },
          { label: "Content Studio" },
        ]}
      />
      <ContentStudio workspaceId={workspace.id} userId={userId} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/ai/studio")({
  component: AiContentStudioPage,
});
