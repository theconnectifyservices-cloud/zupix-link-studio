import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail, BookOpen, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/shared/navigation/page-header";

export const Route = createFileRoute("/_authenticated/app/help")({
  component: HelpPage,
});

const items = [
  { icon: BookOpen, title: "Documentation", description: "Guides and best practices.", href: "#" },
  { icon: MessageCircle, title: "Community", description: "Ask questions, share tips.", href: "#" },
  { icon: Mail, title: "Contact support", description: "Reach out to our team.", href: "mailto:support@zupix.link" },
];

function HelpPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Help & Support"
        description="Resources, docs, and ways to reach us."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Help & Support" }]}
        actions={<LifeBuoy className="h-6 w-6 text-muted-foreground" />}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <a key={it.title} href={it.href} className="block">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
              <CardHeader>
                <div className="mb-2 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                  <it.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{it.title}</CardTitle>
                <CardDescription>{it.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
