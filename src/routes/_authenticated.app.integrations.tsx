import { createFileRoute } from "@tanstack/react-router";
import { Puzzle } from "lucide-react";
import { ComingSoonPage } from "@/shared/ui/coming-soon-page";

export const Route = createFileRoute("/_authenticated/app/integrations")({
  component: () => (
    <ComingSoonPage
      title="Integrations"
      description="Plug in email, analytics, payments, and more."
      icon={Puzzle}
      breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Integrations" }]}
    />
  ),
});
