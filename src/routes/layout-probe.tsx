import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/shared/layouts";
import { PageHeader } from "@/shared/navigation/page-header";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/layout-probe")({
  ssr: false,
  component: () => (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl" id="probe-root">
        <PageHeader
          title="Welcome back, Rajesh Kumar"
          description="Workspace: Rajesh Kumar's Workspace"
          actions={<Button className="gap-1">New bio page</Button>}
        />
        <div id="probe-card" className="rounded-xl border p-4">
          <p>Probe body content for width measurement.</p>
        </div>
      </div>
    </DashboardLayout>
  ),
});
