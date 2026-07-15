import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSession } from "@/features/auth/hooks/use-session";
import { EnterpriseDashboard } from "@/features/enterprise";

function EnterprisePage() {
  const session = useSession();
  if (session.status === "loading") return <PageLoader label="Loading enterprise" />;
  if (session.status !== "authenticated") {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Sign in required"
        description="Sign in to access the Enterprise console."
      />
    );
  }
  return (
    <div>
      <PageHeader
        title="Enterprise"
        description="Organizations, departments, licensing, governance and compliance — all in one console."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Enterprise" }]}
      />
      <EnterpriseDashboard userId={session.session.user.id} />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/enterprise")({
  component: EnterprisePage,
});
