import { createFileRoute } from "@tanstack/react-router";
import { LicenseManager } from "@/features/licenses";

export const Route = createFileRoute("/_authenticated/admin/licenses")({
  head: () => ({
    meta: [
      { title: "License Manager · ZUPIX Admin" },
      {
        name: "description",
        content: "Create, activate, suspend and export ZUPIX Link Studio licence keys.",
      },
      { property: "og:title", content: "License Manager · ZUPIX Admin" },
      { property: "og:description", content: "Enterprise licence key administration for ZUPIX Link Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-7xl p-6">
      <LicenseManager />
    </div>
  ),
});
