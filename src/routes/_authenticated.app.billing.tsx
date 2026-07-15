import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { BillingDashboard } from "@/features/billing";

function BillingRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage your plan, invoices, coupons and tax details."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Billing" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading billing" />
      ) : !workspace ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to manage billing."
        />
      ) : (
        <BillingDashboard workspaceId={workspace.id} workspaceName={workspace.name} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/billing")({
  component: BillingRoute,
});
