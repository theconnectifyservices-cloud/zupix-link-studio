import { createFileRoute } from "@tanstack/react-router";
import { Plug } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { IntegrationCenter } from "@/features/integrations";

function IntegrationsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Integrations"
        description="Connect payments, email, marketing, communication, storage, and automation services."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Integrations" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading integrations" />
      ) : !workspace ? (
        <EmptyState
          icon={<Plug className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to manage integrations."
        />
      ) : (
        <IntegrationCenter workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations · ZUPIX Link Studio" },
      {
        name: "description",
        content:
          "Enterprise Integration Hub — connect Razorpay, PayU, Cashfree, UPI, SMTP, Gmail, GA4, GTM, Meta Pixel, WhatsApp, Slack and more.",
      },
      { property: "og:title", content: "Integrations · ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Connect payments, email, marketing, communication and automation services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsRoute,
});
