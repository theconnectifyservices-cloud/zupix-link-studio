import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { SupportCenter } from "@/features/support";

export const Route = createFileRoute("/_authenticated/app/help")({
  component: HelpPage,
  head: () => ({
    meta: [
      { title: "Help & Support — ZUPIX Link Studio" },
      {
        name: "description",
        content:
          "Get help with ZUPIX Link Studio: email and WhatsApp support, support hours and response times.",
      },
      { property: "og:title", content: "Help & Support — ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Contact ZUPIX Link Studio support by email or WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Help & Support"
        description="Guides, community and direct access to our support team."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Help & Support" }]}
        actions={<LifeBuoy className="h-6 w-6 text-muted-foreground" />}
      />
      <SupportCenter />
    </div>
  );
}
