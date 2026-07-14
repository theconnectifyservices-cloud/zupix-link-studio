import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { TemplateGallery } from "@/features/templates";

export const Route = createFileRoute("/_authenticated/app/templates")({
  component: TemplatesPage,
});

function TemplatesPage() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-7xl flex-col">
      <PageHeader
        title="Templates"
        description="Browse professionally designed presets. Open any bio page to apply a template."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Templates" }]}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <LayoutTemplate className="h-3.5 w-3.5" /> {"Preview · Import · Export"}
          </span>
        }
      />
      <TemplateGallery mode="browse" />
    </div>
  );
}
