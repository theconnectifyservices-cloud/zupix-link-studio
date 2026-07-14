import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { ComingSoonPage } from "@/shared/ui/coming-soon-page";

export const Route = createFileRoute("/_authenticated/app/domains")({
  component: () => (
    <ComingSoonPage
      title="Domains"
      description="Connect your custom domain to any bio page."
      icon={Globe}
      breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Domains" }]}
    />
  ),
});
