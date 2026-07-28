import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { SubscriptionsTable } from "@/features/subscription/components/subscriptions-table";

export const Route = createFileRoute("/_authenticated/admin/subscription-management")({
  head: () => ({
    meta: [
      { title: "Subscription Management · ZUPIX Admin" },
      { name: "description", content: "Manage customer subscriptions, plan assignments, renewals and lifecycle actions." },
    ],
  }),
  component: SubscriptionManagementPage,
});

function SubscriptionManagementPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Subscription Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Assign, extend, upgrade, suspend or cancel plans for every customer workspace.
        </p>
      </div>
      <SubscriptionsTable />
    </div>
  );
}
