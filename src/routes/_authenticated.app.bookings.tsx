import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { BookingsDashboard } from "@/features/business";

function BookingsRoute() {
  const { workspace, isLoading } = useCurrentWorkspace();
  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Appointment and consultation requests from your bio pages."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Bookings" }]}
      />
      {isLoading ? (
        <PageLoader label="Loading bookings" />
      ) : !workspace ? (
        <EmptyState
          icon={<CalendarClock className="h-8 w-8" />}
          title="No workspace found"
          description="Create or join a workspace to accept bookings."
        />
      ) : (
        <BookingsDashboard workspaceId={workspace.id} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/bookings")({
  component: BookingsRoute,
  head: () => ({
    meta: [
      { title: "Bookings — ZUPIX Link Studio" },
      {
        name: "description",
        content: "Approve, reschedule and track appointment requests from your bio pages.",
      },
      { property: "og:title", content: "Bookings — ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Approve, reschedule and track appointment requests from your bio pages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
