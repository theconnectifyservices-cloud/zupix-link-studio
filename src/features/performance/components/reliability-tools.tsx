import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { retry, CircuitBreaker } from "../reliability";
import { useMaintenanceStore } from "../maintenance.store";
import { runHealthChecks } from "../health";

const breaker = new CircuitBreaker(3, 15_000);

export function ReliabilityTools() {
  const maint = useMaintenanceStore();
  const [breakerState, setBreakerState] = useState(breaker.getState());
  const [retryLog, setRetryLog] = useState<string[]>([]);

  const testRetry = async () => {
    setRetryLog([]);
    let n = 0;
    try {
      await retry(async () => {
        n += 1;
        if (n < 3) throw new Error(`attempt ${n} failed`);
        return "ok";
      }, {
        retries: 4,
        minDelayMs: 150,
        onAttempt: (a, err) => setRetryLog((l) => [...l, `attempt ${a + 1}: ${(err as Error).message}`]),
      });
      setRetryLog((l) => [...l, "succeeded on attempt 3 ✓"]);
      toast.success("Retry succeeded");
    } catch {
      toast.error("Retry exhausted");
    }
  };

  const testBreaker = async () => {
    try {
      await breaker.exec(async () => {
        throw new Error("simulated downstream failure");
      });
    } catch {
      /* expected */
    }
    setBreakerState(breaker.getState());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reliability Tools</h2>
        <p className="text-sm text-muted-foreground">Retry, circuit breaker, health probes and maintenance mode.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Automatic retry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Exponential backoff with jitter, capped at 4s.</p>
            <Button onClick={testRetry} size="sm">Run test</Button>
            {retryLog.length > 0 && (
              <pre className="rounded-md bg-muted p-2 text-xs">{retryLog.join("\n")}</pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Circuit breaker
              <Badge variant="outline">{breakerState}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Opens after 3 failures; cools down for 15s.</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={testBreaker}>Trip failure</Button>
              <Button size="sm" variant="outline" onClick={() => { breaker.reset(); setBreakerState(breaker.getState()); }}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Health probes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Re-run all subsystem probes on demand.</p>
            <Button size="sm" onClick={() => { void runHealthChecks(); toast.success("Health probes triggered"); }}>
              Run all probes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Maintenance mode</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="maint-toggle">Enable maintenance mode</Label>
              <Switch id="maint-toggle" checked={maint.enabled} onCheckedChange={maint.setEnabled} />
            </div>
            <Textarea
              value={maint.message}
              onChange={(e) => maint.setMessage(e.target.value)}
              rows={3}
              placeholder="Message shown to users"
            />
            <p className="text-xs text-muted-foreground">
              When enabled, wrap protected surfaces with the maintenance layout.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
