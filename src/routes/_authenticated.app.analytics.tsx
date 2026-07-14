import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ComingSoonPage } from "@/shared/ui/coming-soon-page";

export const Route = createFileRoute("/_authenticated/app/analytics")({
  component: () => (
    <ComingSoonPage
      title="Analytics"
      description="Track visits, clicks, and conversions across your bio pages."
      icon={BarChart3}
      breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Analytics" }]}
    />
  ),
});
