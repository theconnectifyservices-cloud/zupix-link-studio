import { createFileRoute } from "@tanstack/react-router";
import { CacheManager } from "@/features/pwa";
import { PageHeader } from "@/shared/navigation/page-header";

export const Route = createFileRoute("/_authenticated/app/settings/pwa")({
  component: PwaSettingsPage,
});

function PwaSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="App & Offline"
        description="Manage installed app storage, cached data, and offline behavior."
      />
      <CacheManager />
    </div>
  );
}
