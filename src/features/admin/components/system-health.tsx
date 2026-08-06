import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { useSystemHealth } from "../hooks/use-monitoring";

export function SystemHealthDashboard() {
  const { data: health, isLoading, refetch } = useSystemHealth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "up": 
      case "healthy": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "degraded":
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "down":
      case "offline": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "up":
      case "healthy": return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Healthy</Badge>;
      case "degraded":
      case "warning": return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>;
      case "down":
      case "offline": return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Down</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">System Health</CardTitle>
        <button 
          onClick={() => refetch()}
          className="text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {health?.length === 0 && !isLoading && (
            <div className="col-span-full py-8 text-center text-muted-foreground">
              All systems operational. No active alerts found.
            </div>
          )}
          {health?.map((service: any) => (
            <div key={service.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <span className="text-sm font-medium">{service.service_name}</span>
                </div>
                {getStatusBadge(service.status)}
              </div>
              {service.message && (
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {service.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
