import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import type { Crumb } from "@/shared/navigation/breadcrumb-nav";

interface Props {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: Crumb[];
  message?: string;
}

/** Placeholder page for features arriving in later phases. */
export function ComingSoonPage({
  title,
  description,
  icon: Icon = Sparkles,
  breadcrumbs,
  message = "This feature is on the roadmap and arrives in a later phase.",
}: Props) {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={title} description={description} breadcrumbs={breadcrumbs} />
      <EmptyState icon={<Icon className="h-8 w-8" />} title="Coming soon" description={message} />
    </div>
  );
}
