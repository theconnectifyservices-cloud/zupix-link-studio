import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Lock } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useSession } from "@/features/auth/hooks/use-session";
import { ContentStudio } from "@/features/ai/content-studio";
import { usePlan } from "@/features/subscription/hooks";
import { useSubscriptionUI } from "@/features/subscription/store";
import { Button } from "@/components/ui/button";

function AiContentStudioPage() {
  const { workspace, isLoading: workspaceLoading } = useCurrentWorkspace();
  const session = useSession();
  const { code: planCode, isLoading: planLoading } = usePlan();
  const { openUpgrade } = useSubscriptionUI();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;

  const isLocked = planCode !== "shikhar";

  if (workspaceLoading || planLoading || !userId) return <PageLoader label="Initializing AI Studio" />;
  if (!workspace)
    return (
      <EmptyState
        icon={<Sparkles className="h-8 w-8" />}
        title="No workspace"
        description="Create or join a workspace to use the AI Studio."
      />
    );

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full mb-4">
          <Lock className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold mb-2">AI Studio (SHIKHAR Exclusive)</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          The AI Studio is an enterprise assistant that helps you build better Bio Pages faster. 
          Available only for SHIKHAR plan subscribers.
        </p>
        <Button 
          size="lg" 
          onClick={() => openUpgrade({ 
            feature: "advanced_builder", 
            suggestedPlan: "shikhar",
            reason: "AI Studio is exclusive to SHIKHAR plan."
          })} 
          className="bg-amber-500 hover:bg-amber-600"
        >
          Upgrade to SHIKHAR
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="AI Studio"
        description="Generate professional bios, complete sections, store copy, and SEO — all brand-aware."
        breadcrumbs={[
          { label: "Dashboard", href: "/app" },
          { label: "AI", href: "/app/ai" },
          { label: "AI Studio" },
        ]}
      />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <ContentStudio workspaceId={workspace.id} userId={userId} />
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/ai/studio")({
  component: AiContentStudioPage,
});
