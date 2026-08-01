import { createFileRoute } from "@tanstack/react-router";
import { UpdatePreferences } from "@/features/updates/components/update-preferences";
import { PageHeader } from "@/shared/navigation/page-header";

export const Route = createFileRoute("/_authenticated/app/settings/updates")({
  head: () => ({
    meta: [
      { title: "Update Preferences · ZUPIX Link Studio" },
      {
        name: "description",
        content:
          "Review the app versions you skipped and restore any release to see its update notification again.",
      },
      { property: "og:title", content: "Update Preferences · ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Manage skipped app versions and update notifications in ZUPIX Link Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UpdatePreferencesPage,
});

function UpdatePreferencesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Update Preferences"
        description="Control which app update notifications you see."
      />
      <UpdatePreferences />
    </div>
  );
}
