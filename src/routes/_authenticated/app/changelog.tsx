import { createFileRoute } from "@tanstack/react-router";
import { ChangelogTimeline } from "@/features/updates";

export const Route = createFileRoute("/_authenticated/app/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog · ZUPIX Link Studio" },
      {
        name: "description",
        content:
          "Every ZUPIX Link Studio release — new features, bug fixes, performance and security updates.",
      },
      { property: "og:title", content: "Changelog · ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Full version history for ZUPIX Link Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChangelogPage,
});

function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Changelog</h1>
        <p className="text-sm text-muted-foreground">
          Everything we've shipped, newest first.
        </p>
      </header>
      <ChangelogTimeline />
    </div>
  );
}
