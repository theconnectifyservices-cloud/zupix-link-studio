import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useVitalsStore, VITAL_THRESHOLDS, type VitalName } from "../vitals.store";
import { useHealthStore, overallHealth } from "../health";
import { useErrorsStore } from "../errors.store";
import { observabilitySummary } from "../observability.store";

const VITAL_ORDER: VitalName[] = ["LCP", "INP", "CLS", "FCP", "TTFB"];

export function PerformanceReports() {
  const latest = useVitalsStore((s) => s.latest);
  const health = useHealthStore((s) => s.checks);
  const errors = useErrorsStore((s) => s.entries);
  const obs = observabilitySummary();
  const overall = overallHealth(health);

  const suggestions: string[] = [];
  for (const n of VITAL_ORDER) {
    const v = latest[n];
    if (!v) continue;
    const t = VITAL_THRESHOLDS[n];
    if (v.value > t.poor) suggestions.push(`${n} is poor (${Math.round(v.value)}${t.unit}) — audit critical rendering path.`);
    else if (v.value > t.good) suggestions.push(`${n} needs improvement (${Math.round(v.value)}${t.unit}).`);
  }
  if (obs.errorRate > 0.05) suggestions.push(`Network error rate ${(obs.errorRate * 100).toFixed(1)}% — inspect failing endpoints.`);
  if (obs.p95 > 1500) suggestions.push(`p95 latency ${Math.round(obs.p95)}ms exceeds 1.5s — consider caching or edge routing.`);
  if (errors.length > 5) suggestions.push(`${errors.length} runtime errors captured — review the Error Monitor.`);
  if (suggestions.length === 0) suggestions.push("All monitored signals are within acceptable thresholds.");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Performance Reports</h2>
        <p className="text-sm text-muted-foreground">Rolled-up snapshot of health, vitals and reliability.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary title="Performance">
          {VITAL_ORDER.map((n) => {
            const v = latest[n];
            return (
              <Row key={n} label={n} value={v ? `${Math.round(v.value)}${VITAL_THRESHOLDS[n].unit}` : "—"} tone={v?.rating === "good" ? "ok" : v?.rating === "poor" ? "bad" : "warn"} />
            );
          })}
        </Summary>

        <Summary title="Reliability">
          <Row label="Requests" value={obs.total.toString()} />
          <Row label="Error rate" value={`${(obs.errorRate * 100).toFixed(1)}%`} tone={obs.errorRate > 0.05 ? "bad" : "ok"} />
          <Row label="p50" value={`${Math.round(obs.p50)}ms`} />
          <Row label="p95" value={`${Math.round(obs.p95)}ms`} tone={obs.p95 > 1500 ? "warn" : "ok"} />
          <Row label="Errors captured" value={errors.length.toString()} tone={errors.length > 5 ? "warn" : "ok"} />
        </Summary>

        <Summary title="Health">
          <Row label="Overall" value={overall} tone={overall === "healthy" ? "ok" : overall === "down" ? "bad" : "warn"} />
          {Object.values(health).map((c) => (
            <Row key={c.key} label={c.label} value={c.status} tone={c.status === "healthy" ? "ok" : c.status === "down" ? "bad" : "warn"} />
          ))}
        </Summary>
      </div>

      <Card>
        <CardHeader><CardTitle>Optimization suggestions</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                {s.startsWith("All monitored") ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                )}
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-1">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" | "bad" }) {
  const cls = tone === "bad" ? "text-red-600 border-red-500/30" : tone === "warn" ? "text-amber-600 border-amber-500/30" : tone === "ok" ? "text-emerald-600 border-emerald-500/30" : "";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="outline" className={cls}>{value}</Badge>
    </div>
  );
}
