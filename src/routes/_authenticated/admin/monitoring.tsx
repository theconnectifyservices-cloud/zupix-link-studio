import { createFileRoute } from "@tanstack/react-router";
import { SystemHealthDashboard } from "@/features/admin/components/system-health";
import { StorageAnalytics } from "@/features/admin/components/storage-analytics";
import { ErrorLogsViewer } from "@/features/admin/components/error-logs";
import { ActivityLogsViewer } from "@/features/admin/components/activity-logs";
import { SecurityEventsViewer } from "@/features/admin/components/security-events";
import { BackupCenter } from "@/features/admin/components/backup-center";
import { Activity, ShieldAlert, FileOutput, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/admin/monitoring")({
  component: MonitoringCenterPage,
});

function MonitoringCenterPage() {
  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Monitoring</h1>
          <p className="text-muted-foreground">Real-time system health, error logs, and infrastructure monitoring.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileOutput className="h-4 w-4" />
            Export Data
          </Button>
          <Button variant="outline" className="gap-2 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </Button>
        </div>
      </div>

      <SystemHealthDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Tabs defaultValue="errors" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
              <TabsTrigger value="errors" className="gap-2">
                <Activity className="h-4 w-4" />
                Error Logs
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <Activity className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                Security Events
              </TabsTrigger>
            </TabsList>
            <TabsContent value="errors" className="mt-4">
              <ErrorLogsViewer />
            </TabsContent>
            <TabsContent value="activity" className="mt-4">
              <ActivityLogsViewer />
            </TabsContent>
            <TabsContent value="security" className="mt-4">
              <SecurityEventsViewer />
            </TabsContent>
          </Tabs>

          <BackupCenter />
        </div>

        <div className="space-y-8">
          <StorageAnalytics />
          
          <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Admin Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "Critical Error", msg: "Database connection spike detected", time: "5m ago", type: "error" },
                { title: "Security Alert", msg: "Multiple failed logins from 192.168.1.1", time: "12m ago", type: "warning" },
                { title: "Storage Warning", msg: "Backup storage at 85% capacity", time: "1h ago", type: "warning" },
              ].map((n, i) => (
                <div key={i} className={`p-3 rounded-lg border flex flex-col gap-1 ${
                  n.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{n.title}</span>
                    <span className="text-[10px] opacity-70">{n.time}</span>
                  </div>
                  <p className="text-xs opacity-90">{n.msg}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
