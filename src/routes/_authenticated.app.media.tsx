import { createFileRoute } from "@tanstack/react-router";
import { Images } from "lucide-react";
import { ComingSoonPage } from "@/shared/ui/coming-soon-page";

export const Route = createFileRoute("/_authenticated/app/media")({
  component: () => (
    <ComingSoonPage
      title="Media Library"
      description="Central library for images, videos, and files."
      icon={Images}
      breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Media Library" }]}
    />
  ),
});
