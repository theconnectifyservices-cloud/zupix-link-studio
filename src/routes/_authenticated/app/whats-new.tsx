import { createFileRoute } from "@tanstack/react-router";
import { ReleaseNotesTimeline } from "@/features/comms";

export const Route = createFileRoute("/_authenticated/app/whats-new")({
  head: () => ({
    meta: [
      { title: "What's New · ZUPIX Link Studio" },
      {
        name: "description",
        content: "Every ZUPIX Link Studio release — new features, improvements and fixes.",
      },
      { property: "og:title", content: "What's New · ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Product release notes for ZUPIX Link Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhatsNewPage,
});

function WhatsNewPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">What's New</h1>
        <p className="text-sm text-muted-foreground">
          Product updates and improvements, newest first.
        </p>
      </header>
      <ReleaseNotesTimeline />
    </div>
  );
}
