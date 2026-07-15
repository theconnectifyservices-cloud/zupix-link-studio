import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useObservabilityStore, observabilitySummary } from "../observability.store";

export function ObservabilityDashboard() {
  const requests = useObservabilityStore((s) => s.requests);
  const events = useObservabilityStore((s) => s.events);
  const s = observabilitySummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Observability</h2>
        <p className="text-sm text-muted-foreground">Instrumented from the browser fetch layer.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Metric label="Requests" value={s.total.toString()} />
        <Metric label="Error rate" value={`${(s.errorRate * 100).toFixed(1)}%`} tone={s.errorRate > 0.05 ? "warn" : "ok"} />
        <Metric label="Avg" value={`${Math.round(s.avg)} ms`} />
        <Metric label="p50" value={`${Math.round(s.p50)} ms`} />
        <Metric label="p95" value={`${Math.round(s.p95)} ms`} tone={s.p95 > 1500 ? "warn" : "ok"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent requests</CardTitle></CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests observed yet.</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-auto text-xs">
                {requests.slice(0, 40).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 border-b border-border/40 py-1.5">
                    <span className="w-12 font-mono text-[10px]">{r.method}</span>
                    <span className="flex-1 truncate">{r.url}</span>
                    <Badge variant="outline" className={r.ok ? "border-emerald-500/30 text-emerald-600" : "border-red-500/30 text-red-600"}>
                      {r.status || "ERR"}
                    </Badge>
                    <span className="w-16 text-right">{Math.round(r.durationMs)}ms</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>System events</CardTitle></CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events emitted.</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-auto text-xs">
                {events.map((e) => (
                  <div key={e.id} className="flex items-center justify-between border-b border-border/40 py-1.5">
                    <Badge variant="outline">{e.type}</Badge>
                    <span className="flex-1 px-2 truncate">{e.message}</span>
                    <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-semibold ${tone === "warn" ? "text-amber-600" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
