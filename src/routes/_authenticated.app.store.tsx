import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { StoreDashboard } from "@/features/business";

function StoreRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Mini Store"
        description="Manage the digital products, services and payment links you sell from your bio pages."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Mini Store" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading store" />
      ) : !workspace ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to build your store catalog."
        />
      ) : (
        <StoreDashboard workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/store")({
  component: StoreRoute,
  head: () => ({
    meta: [
      { title: "Mini Store — ZUPIX Link Studio" },
      {
        name: "description",
        content:
          "Manage digital products, services and payment links sold directly from your ZUPIX bio pages.",
      },
      { property: "og:title", content: "Mini Store — ZUPIX Link Studio" },
      {
        property: "og:description",
        content:
          "Manage digital products, services and payment links sold directly from your ZUPIX bio pages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
