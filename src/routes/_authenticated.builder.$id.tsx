import { useEffect, useMemo, useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BuilderTopbar,
  BuilderLeftPanel,
  BuilderRightPanel,
  BuilderPreview,
  BuilderDndProvider,
  fetchBuilderPage,
  useBuilderStore,
  useAutoSave,
  useBuilderShortcuts,
  getRecoveredDraft,
  clearRecoveredDraft,
  type RecoveredDraft,
} from "@/features/builder";
import { BuilderMobileShell } from "@/features/builder/components/builder-mobile-shell";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageLoader } from "@/shared/ui/page-loader";
import { ErrorState } from "@/shared/ui/error-state";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/builder/$id")({
  ssr: false,
  component: BuilderPage,
});

export type PreviewViewport = "mobile" | "tablet" | "desktop";

function BuilderPage() {
  const { id } = Route.useParams();
  const [previewMode, setPreviewMode] = useState(false);
  const [viewport, setViewport] = useState<PreviewViewport>("mobile");
  const [draft, setDraft] = useState<RecoveredDraft | null>(null);
  const load = useBuilderStore((s) => s.load);
  const reset = useBuilderStore((s) => s.reset);

  const { data, isLoading, error } = useQuery({
    queryKey: ["builder-page", id],
    queryFn: () => fetchBuilderPage(id),
  });

  useEffect(() => {
    if (!data) return;
    load(data.id, data.name, data.content, data.slug);
    // detect a local draft newer than the server's saved copy
    const recovered = getRecoveredDraft(data.id);
    if (recovered) {
      const serverStr = JSON.stringify(data.content ?? { blocks: [] });
      const draftStr = JSON.stringify(recovered.content);
      if (serverStr !== draftStr) setDraft(recovered);
      else clearRecoveredDraft(data.id);
    }
    return () => reset();
  }, [data, load, reset]);

  useAutoSave(data?.id ?? null);
  useBuilderShortcuts(!previewMode);

  const bannerAt = useMemo(() => (draft ? new Date(draft.at).toLocaleString() : ""), [draft]);

  if (isLoading) return <PageLoader />;
  if (error)
    return <ErrorState title="Couldn't load page" description={(error as Error).message} />;
  if (!data) throw notFound();

  const isMobile = useIsMobile();

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <BuilderDndProvider>
        {!isMobile && (
          <BuilderTopbar
            onTogglePreview={() => setPreviewMode((v) => !v)}
            previewMode={previewMode}
            viewport={viewport}
            onViewportChange={setViewport}
          />
        )}
        {draft && (
          <div className="flex items-center gap-2 border-b bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">Unsaved changes recovered from {bannerAt}.</span>
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => {
                load(data.id, data.name, draft.content, data.slug);
                clearRecoveredDraft(data.id);
                setDraft(null);
              }}
            >
              Restore
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => {
                clearRecoveredDraft(data.id);
                setDraft(null);
              }}
            >
              Discard
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Dismiss"
              className="h-7 w-7"
              onClick={() => setDraft(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
        {isMobile ? (
          <div className="min-h-0 flex-1">
            <BuilderMobileShell
              previewMode={previewMode}
              onTogglePreview={() => setPreviewMode((v) => !v)}
              viewport={viewport}
            />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            {!previewMode && (
              <aside className="hidden w-72 shrink-0 border-r bg-background md:flex">
                <BuilderLeftPanel />
              </aside>
            )}
            <div className="min-w-0 flex-1">
              <BuilderPreview viewport={viewport} />
            </div>
            {!previewMode && (
              <aside className="hidden w-80 shrink-0 border-l bg-background lg:flex">
                <BuilderRightPanel />
              </aside>
            )}
          </div>
        )}
      </BuilderDndProvider>
    </div>
  );
}
