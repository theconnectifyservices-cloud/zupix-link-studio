import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { MediaLibrary } from "@/features/media";

function MediaRoute() {
  const { workspace, isLoading, userId } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Upload, organize and reuse images, videos, and files across all your bio pages."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Media Library" }]}
      />
      {isLoading || !userId ? (
        <PageLoader label="Loading media" />
      ) : !workspace ? (
        <EmptyState
          icon={<Images className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to upload media."
        />
      ) : (
        <MediaLibrary workspaceId={workspace.id} userId={userId} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/media")({
  component: MediaRoute,
});
