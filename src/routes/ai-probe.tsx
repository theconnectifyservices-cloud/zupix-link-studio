import { createFileRoute } from "@tanstack/react-router";
import { Plus, Wand2, Palette, TrendingUp } from "lucide-react";
import { PageHeader } from "@/shared/navigation/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/shared/layouts/dashboard-layout";

function Probe() {
  return (
    <DashboardLayout>
      <div data-probe="ai-root">
        <PageHeader
          title="ZUPIX AI Workspace"
          description="Your intelligent assistant for bio pages, templates, analytics and more."
          breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "AI" }]}
          actions={
            <div className="flex min-w-0 flex-wrap justify-end gap-2">
              <Button variant="outline">
                <TrendingUp className="mr-1 h-4 w-4" /> Growth Coach
              </Button>
              <Button variant="outline">
                <Palette className="mr-1 h-4 w-4" /> Design Studio
              </Button>
              <Button variant="outline">
                <Wand2 className="mr-1 h-4 w-4" /> Content Studio
              </Button>
              <Button>
                <Plus className="mr-1 h-4 w-4" /> New chat
              </Button>
            </div>
          }
        />
        <div className="space-y-6" data-probe="ai-body">
          <Tabs defaultValue="recent">
            <TabsList data-probe="tabslist">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="suggested">Suggested tasks</TabsTrigger>
              <TabsTrigger value="tools">AI Tools</TabsTrigger>
              <TabsTrigger value="prompts">Prompt Library</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="recent" className="mt-4" data-probe="tabcontent">
              <div className="grid gap-3 sm:grid-cols-2" data-probe="grid">
                <div className="rounded-lg border bg-card p-4" data-probe="card">
                  <h4 className="font-medium" data-probe="cardtitle">
                    Summarize my bio pages
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Get an overview of your active pages and their status.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const Route = createFileRoute("/ai-probe")({ component: Probe, ssr: false });
