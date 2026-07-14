import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import { ComingSoonPage } from "@/shared/ui/coming-soon-page";

export const Route = createFileRoute("/_authenticated/app/templates")({
  component: () => (
    <ComingSoonPage
      title="Templates"
      description="Beautiful presets to launch a bio page in seconds."
      icon={LayoutTemplate}
      breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Templates" }]}
    />
  ),
});
