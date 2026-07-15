import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useVitalsStore, VITAL_THRESHOLDS, formatVital, type VitalName, type Rating } from "../vitals.store";
import { startWebVitals } from "../web-vitals";

const ORDER: VitalName[] = ["LCP", "INP", "CLS", "FCP", "TTFB"];

const RATING_COLOR: Record<Rating, string> = {
  good: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  "needs-improvement": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  poor: "bg-red-500/15 text-red-600 border-red-500/30",
};

function trendFor(samples: ReturnType<typeof useVitalsStore.getState>["samples"], name: VitalName) {
  const filtered = samples.filter((s) => s.name === name).slice(-6);
  if (filtered.length < 2) return null;
  const first = filtered[0].value;
  const last = filtered[filtered.length - 1].value;
  const delta = last - first;
  return { delta, improving: delta < 0 }; // lower is better for all these vitals
}

export function VitalsCenter() {
  const latest = useVitalsStore((s) => s.latest);
  const samples = useVitalsStore((s) => s.samples);
  const clear = useVitalsStore((s) => s.clear);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Core Web Vitals</h2>
          <p className="text-sm text-muted-foreground">Real-user metrics captured from this session.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => startWebVitals()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Re-init
          </Button>
          <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {ORDER.map((name) => {
          const v = latest[name];
          const t = VITAL_THRESHOLDS[name];
          const trend = trendFor(samples, name);
          return (
            <Card key={name}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-medium">
                  <span>{name}</span>
                  {v && <Badge variant="outline" className={RATING_COLOR[v.rating]}>{v.rating}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{v ? formatVital(name, v.value) : "—"}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  good ≤ {t.unit === "ms" ? `${t.good} ms` : t.good} · poor ≥ {t.unit === "ms" ? `${t.poor} ms` : t.poor}
                </p>
                {trend && (
                  <div className={`mt-2 flex items-center gap-1 text-xs ${trend.improving ? "text-emerald-600" : "text-amber-600"}`}>
                    {trend.improving ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {trend.improving ? "improving" : "regressing"}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle>Recent samples</CardTitle></CardHeader>
        <CardContent>
          {samples.length === 0 ? (
            <p className="text-sm text-muted-foreground">Interact with the app to collect samples.</p>
          ) : (
            <div className="max-h-64 overflow-auto text-sm">
              {samples.slice().reverse().slice(0, 30).map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/40 py-1.5">
                  <span className="font-mono text-xs">{s.name}</span>
                  <span>{formatVital(s.name, s.value)}</span>
                  <Badge variant="outline" className={RATING_COLOR[s.rating]}>{s.rating}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
