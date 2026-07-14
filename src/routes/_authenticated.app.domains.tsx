import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Globe, Layers } from "lucide-react";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { listDomains } from "@/features/domains/api";
import { SubdomainCard } from "@/features/domains/components/subdomain-card";
import { BrandingCard } from "@/features/domains/components/branding-card";
import { ConnectDomainDialog } from "@/features/domains/components/connect-domain-dialog";
import { DomainCard } from "@/features/domains/components/domain-card";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app/domains")({
  component: DomainsPage,
});

function DomainsPage() {
  const { workspace, isLoading } = useCurrentWorkspace();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Domains & Branding"
        description="Connect custom domains, manage your ZUPIX subdomain, and control workspace branding."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "Domains" }]}
      />
      {isLoading || !workspace ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="domains">
          <TabsList>
            <TabsTrigger value="domains" className="gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Domains
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Branding
            </TabsTrigger>
          </TabsList>
          <TabsContent value="domains" className="space-y-4 pt-4">
            <SubdomainCard workspaceId={workspace.id} />
            <CustomDomainsSection workspaceId={workspace.id} />
            <StatusOverviewCard workspaceId={workspace.id} />
          </TabsContent>
          <TabsContent value="branding" className="pt-4">
            <BrandingCard workspaceId={workspace.id} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function CustomDomainsSection({ workspaceId }: { workspaceId: string }) {
  const { data: domains, isLoading } = useQuery({
    queryKey: ["domains", workspaceId],
    queryFn: () => listDomains(workspaceId),
    refetchInterval: (q) => {
      const rows = q.state.data ?? [];
      return rows.some((d) => d.status === "pending" || d.ssl_status === "provisioning")
        ? 8000
        : false;
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Custom domains</h2>
          <p className="text-xs text-muted-foreground">
            Bring your own domain. We handle SSL and DNS verification automatically.
          </p>
        </div>
        <ConnectDomainDialog workspaceId={workspaceId} />
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !domains || domains.length === 0 ? (
        <EmptyState
          icon={<Globe className="h-6 w-6" />}
          title="No custom domains yet"
          description="Connect a domain like example.com or www.brand.com to serve your bio pages."
        />
      ) : (
        <div className="space-y-3">
          {domains.map((d) => (
            <DomainCard key={d.id} domain={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatusOverviewCard({ workspaceId }: { workspaceId: string }) {
  const { data } = useQuery({
    queryKey: ["domains", workspaceId],
    queryFn: () => listDomains(workspaceId),
  });
  const rows = data ?? [];
  if (rows.length === 0) return null;
  const verified = rows.filter((d) => d.status === "verified").length;
  const pending = rows.filter((d) => d.status === "pending").length;
  const sslActive = rows.filter((d) => d.ssl_status === "active").length;
  const primary = rows.find((d) => d.is_primary)?.host ?? "—";
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-4">
        <Stat label="Connected" value={rows.length} />
        <Stat label="Verified" value={verified} sub={`${pending} pending`} />
        <Stat label="SSL active" value={sslActive} />
        <Stat label="Primary" value={primary} />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-lg font-semibold">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
