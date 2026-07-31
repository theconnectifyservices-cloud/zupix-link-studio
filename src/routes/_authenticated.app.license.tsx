import { createFileRoute } from "@tanstack/react-router";
import { MyLicense } from "@/features/licenses";
import { PageHeader } from "@/shared/navigation/page-header";

export const Route = createFileRoute("/_authenticated/app/license")({
  head: () => ({
    meta: [
      { title: "My License · ZUPIX Link Studio" },
      {
        name: "description",
        content: "View your ZUPIX licence key, plan, activation date, expiry and device usage.",
      },
      { property: "og:title", content: "My License · ZUPIX Link Studio" },
      { property: "og:description", content: "Licence details and renewal for your ZUPIX account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LicensePage,
});

function LicensePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="My License" description="Your activation, plan and device details." />
      <MyLicense />
    </div>
  );
}
