import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import { PageLoader } from "@/shared/ui/page-loader";
import { EmptyState } from "@/shared/ui/empty-state";
import { useSession } from "@/features/auth/hooks/use-session";
import { listMyTenants } from "@/features/white-label";
import { ResellerDashboard } from "@/features/reseller";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ResellerPage() {
  const session = useSession();
  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ["white-label", "tenants"],
    queryFn: listMyTenants,
    enabled: session.status === "authenticated",
  });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const active = useMemo(
    () => tenants.find((t) => t.id === tenantId) ?? tenants[0] ?? null,
    [tenants, tenantId],
  );

  if (session.status === "loading" || isLoading) return <PageLoader label="Loading reseller console" />;
  if (session.status !== "authenticated") {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="Sign in required"
        description="Sign in to access the reseller console."
      />
    );
  }
  if (!active) {
    return (
      <EmptyState
        icon={<Building2 className="h-8 w-8" />}
        title="No reseller tenant"
        description="Create a partner tenant in White Label first, then return here to manage clients."
      />
    );
  }
  return (
    <div>
      {tenants.length > 1 && (
        <div className="border-b bg-muted/20 px-6 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Tenant:</span>
            <Select value={active.id} onValueChange={setTenantId}>
              <SelectTrigger className="h-8 w-[240px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <ResellerDashboard
        tenantId={active.id}
        tenantName={active.company_name}
        userId={session.session.user.id}
      />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/app/reseller")({
  component: ResellerPage,
});
