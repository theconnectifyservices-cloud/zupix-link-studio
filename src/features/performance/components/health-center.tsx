import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Database, Cloud, HardDrive, ListChecks, Sparkles } from "lucide-react";
import { useHealthStore, runHealthChecks, overallHealth, type HealthStatus } from "../health";

const ICONS: Record<string, typeof Activity> = {
  app: Activity,
  db: Database,
  api: Cloud,
  storage: HardDrive,
  queue: ListChecks,
  ai: Sparkles,
};

const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  degraded: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  down: "bg-red-500/15 text-red-600 border-red-500/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export function HealthCenter() {
  const checks = useHealthStore((s) => s.checks);
  const running = useHealthStore((s) => s.running);
  const overall = overallHealth(checks);

  useEffect(() => {
    if (Object.keys(checks).length === 0) void runHealthChecks();
  }, [checks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Application Health</h2>
          <p className="text-sm text-muted-foreground">Live probes against critical subsystems.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={STATUS_COLOR[overall]}>Overall: {overall}</Badge>
          <Button size="sm" variant="outline" disabled={running} onClick={() => runHealthChecks()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${running ? "animate-spin" : ""}`} /> Re-run
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.values(checks).map((c) => {
          const Icon = ICONS[c.key] ?? Activity;
          return (
            <Card key={c.key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {c.label}</span>
                  <Badge variant="outline" className={STATUS_COLOR[c.status]}>{c.status}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {c.latencyMs != null ? `${Math.round(c.latencyMs)} ${c.key === "queue" ? "jobs" : "ms"}` : "—"}
                </div>
                {c.message && <p className="mt-1 text-xs text-muted-foreground">{c.message}</p>}
                <p className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  checked {new Date(c.checkedAt).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
