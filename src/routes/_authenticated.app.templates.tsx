import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, LayoutTemplate, Sparkles } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { TemplateGallery } from "@/features/templates";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/features/subscription/hooks";

export const Route = createFileRoute("/_authenticated/app/templates")({
  head: () => ({
    meta: [
      { title: "Theme Library · ZUPIX Link Studio" },
      {
        name: "description",
        content:
          "Browse 70+ marketplace-grade bio page themes — from minimal editorial to neon cyber and enterprise-white-label.",
      },
      { property: "og:title", content: "Theme Library · ZUPIX Link Studio" },
      { property: "og:description", content: "70+ premium bio page themes, categorised and previewable in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { code } = usePlan();
  const showUpgradeChip = code === "udaan";

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-7xl flex-col">
      <PageHeader
        title="Theme Library"
        description="70+ marketplace-grade themes across free, premium and enterprise tiers. Preview any theme, then apply it from the builder."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Themes" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <LayoutTemplate className="h-3.5 w-3.5" /> Preview · Import · Export
            </span>
            {showUpgradeChip && (
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/pricing">
                  <Crown className="h-3.5 w-3.5" /> Unlock Premium
                </Link>
              </Button>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary/15 to-amber-500/15 px-2.5 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> New: 55 premium themes
            </span>
          </div>
        }
      />
      <TemplateGallery mode="browse" />
    </div>
  );
}
