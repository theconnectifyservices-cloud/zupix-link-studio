import { createFileRoute } from "@tanstack/react-router";
import { CommunicationCenter } from "@/features/comms";

export const Route = createFileRoute("/_authenticated/admin/communication-center")({
  head: () => ({
    meta: [
      { title: "Communication Center · ZUPIX Admin" },
      {
        name: "description",
        content:
          "Create in-app notifications, manage the announcement bar and publish release notes for ZUPIX Link Studio.",
      },
      { property: "og:title", content: "Communication Center · ZUPIX Admin" },
      {
        property: "og:description",
        content: "In-app notifications, announcement bar and release notes administration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <CommunicationCenter />
    </div>
  ),
});
