import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VitalsCenter } from "@/features/performance/components/vitals-center";
import { HealthCenter } from "@/features/performance/components/health-center";
import { ErrorMonitor } from "@/features/performance/components/error-monitor";
import { ObservabilityDashboard } from "@/features/performance/components/observability-dashboard";
import { ResourceMonitor } from "@/features/performance/components/resource-monitor";
import { ReliabilityTools } from "@/features/performance/components/reliability-tools";
import { PerformanceReports } from "@/features/performance/components/performance-reports";
import { OptimizerPanel } from "@/features/performance/components/optimizer-panel";

export const Route = createFileRoute("/_authenticated/app/performance")({
  head: () => ({
    meta: [
      { title: "Performance & Reliability · ZUPIX" },
      { name: "description", content: "Core Web Vitals, health monitoring, observability and reliability tools." },
    ],
  }),
  component: PerformancePage,
});

function PerformancePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Performance & Reliability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enterprise-grade monitoring, edge optimization and observability for ZUPIX Link Studio.
        </p>
      </div>

      <Tabs defaultValue="vitals" className="space-y-6">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="optimizer">Optimizer & Edge</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="observability">Observability</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals"><VitalsCenter /></TabsContent>
        <TabsContent value="optimizer"><OptimizerPanel /></TabsContent>
        <TabsContent value="health"><HealthCenter /></TabsContent>
        <TabsContent value="errors"><ErrorMonitor /></TabsContent>
        <TabsContent value="observability"><ObservabilityDashboard /></TabsContent>
        <TabsContent value="resources"><ResourceMonitor /></TabsContent>
        <TabsContent value="reliability"><ReliabilityTools /></TabsContent>
        <TabsContent value="reports"><PerformanceReports /></TabsContent>
      </Tabs>
    </div>
  );
}
