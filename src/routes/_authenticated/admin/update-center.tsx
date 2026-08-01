import { createFileRoute } from "@tanstack/react-router";
import { UpdateCenterAdmin } from "@/features/updates";

export const Route = createFileRoute("/_authenticated/admin/update-center")({
  head: () => ({
    meta: [
      { title: "App Update Center · ZUPIX Admin" },
      {
        name: "description",
        content:
          "Publish ZUPIX Link Studio version releases, target customers by plan and track update adoption.",
      },
      { property: "og:title", content: "App Update Center · ZUPIX Admin" },
      {
        property: "og:description",
        content: "Version management, release targeting and adoption analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <UpdateCenterAdmin />
    </div>
  ),
});
