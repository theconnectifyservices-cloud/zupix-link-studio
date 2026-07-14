import { useEffect, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BuilderTopbar,
  BuilderLeftPanel,
  BuilderRightPanel,
  BuilderPreview,
  fetchBuilderPage,
  useBuilderStore,
  useAutoSave,
} from "@/features/builder";
import { PageLoader } from "@/shared/ui/page-loader";
import { ErrorState } from "@/shared/ui/error-state";

export const Route = createFileRoute("/_authenticated/builder/$id")({
  ssr: false,
  component: BuilderPage,
});

function BuilderPage() {
  const { id } = Route.useParams();
  const [previewMode, setPreviewMode] = useState(false);
  const load = useBuilderStore((s) => s.load);
  const reset = useBuilderStore((s) => s.reset);

  const { data, isLoading, error } = useQuery({
    queryKey: ["builder-page", id],
    queryFn: () => fetchBuilderPage(id),
  });

  useEffect(() => {
    if (data) load(data.id, data.name, data.content);
    return () => reset();
  }, [data, load, reset]);

  useAutoSave(data?.id ?? null);

  if (isLoading) return <PageLoader />;
  if (error) return <ErrorState title="Couldn't load page" description={(error as Error).message} />;
  if (!data) throw notFound();

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <BuilderTopbar
        onTogglePreview={() => setPreviewMode((v) => !v)}
        previewMode={previewMode}
      />
      <div className="flex min-h-0 flex-1">
        {!previewMode && (
          <aside className="hidden w-72 shrink-0 border-r bg-background md:flex">
            <BuilderLeftPanel />
          </aside>
        )}
        <div className="min-w-0 flex-1">
          <BuilderPreview />
        </div>
        {!previewMode && (
          <aside className="hidden w-80 shrink-0 border-l bg-background lg:flex">
            <BuilderRightPanel />
          </aside>
        )}
      </div>
    </div>
  );
}
