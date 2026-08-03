import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { LeadsDashboard } from "@/features/business";

function LeadsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Leads"
        description="Contact form submissions from your bio pages."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Leads" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading leads" />
      ) : !workspace ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to collect leads."
        />
      ) : (
        <LeadsDashboard workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/leads")({
  component: LeadsRoute,
  head: () => ({
    meta: [
      { title: "Leads — ZUPIX Link Studio" },
      {
        name: "description",
        content: "Review and export contact form submissions captured by your bio pages.",
      },
      { property: "og:title", content: "Leads — ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Review and export contact form submissions captured by your bio pages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
