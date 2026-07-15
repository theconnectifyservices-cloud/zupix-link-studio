import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, MinusCircle, ShieldCheck } from "lucide-react";
import {
  RELEASE_CHECKLIST,
  KNOWN_BUGS,
  summarize,
  type QAItem,
  type QAStatus,
  type QASeverity,
} from "../checklist";

const STATUS_META: Record<QAStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  pass: {
    label: "PASS",
    cls: "text-emerald-600 border-emerald-500/30 bg-emerald-500/10",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  fail: {
    label: "FAIL",
    cls: "text-red-600 border-red-500/30 bg-red-500/10",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  na: {
    label: "N/A",
    cls: "text-muted-foreground border-border bg-muted/40",
    icon: <MinusCircle className="h-3.5 w-3.5" />,
  },
};

const SEV_CLS: Record<QASeverity, string> = {
  critical: "text-red-600 border-red-500/30",
  high: "text-orange-600 border-orange-500/30",
  medium: "text-amber-600 border-amber-500/30",
  low: "text-blue-600 border-blue-500/30",
};

export function QACenter() {
  const summary = useMemo(() => summarize(RELEASE_CHECKLIST), []);
  const grouped = useMemo(() => {
    const g: Record<string, QAItem[]> = {};
    for (const i of RELEASE_CHECKLIST) (g[i.category] ??= []).push(i);
    return g;
  }, []);

  const criticalOpen = KNOWN_BUGS.filter(
    (b) => b.status === "open" && (b.severity === "critical" || b.severity === "high"),
  ).length;
  const certified = summary.fail === 0 && criticalOpen === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Production QA & Certification</h2>
        <p className="text-sm text-muted-foreground">
          Release readiness across regression, accessibility, SEO, performance and compliance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Release Certification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-tight">{summary.score}</span>
              <Badge
                variant="outline"
                className={
                  certified
                    ? "mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    : "mb-2 border-amber-500/30 bg-amber-500/10 text-amber-600"
                }
              >
                {certified ? "Certified for release" : "Pending review"}
              </Badge>
            </div>
            <Progress value={summary.score} className="mt-4 h-2" />
            <p className="mt-3 text-xs text-muted-foreground">
              {summary.pass} pass · {summary.fail} fail · {summary.na} N/A · {summary.total} total checks
            </p>
          </CardContent>
        </Card>

        <Stat label="Critical bugs" value={KNOWN_BUGS.filter((b) => b.severity === "critical" && b.status === "open").length} tone="bad" />
        <Stat label="Open bugs" value={KNOWN_BUGS.filter((b) => b.status === "open").length} tone="warn" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(grouped).map(([category, items]) => {
          const s = summarize(items);
          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>{category}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {s.pass}/{s.total} pass
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((i) => {
                  const meta = STATUS_META[i.status];
                  return (
                    <div
                      key={i.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-muted/20 p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-sm">{i.label}</div>
                        {i.note && (
                          <div className="mt-0.5 text-xs text-muted-foreground">{i.note}</div>
                        )}
                      </div>
                      <Badge variant="outline" className={`gap-1 shrink-0 ${meta.cls}`}>
                        {meta.icon}
                        {meta.label}
                      </Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Bug Triage</CardTitle>
        </CardHeader>
        <CardContent>
          {KNOWN_BUGS.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tracked bugs.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {KNOWN_BUGS.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between border-b border-border/40 py-2"
                >
                  <div>
                    <div className="font-medium">{b.title}</div>
                    <div className="text-xs text-muted-foreground">{b.area}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={SEV_CLS[b.severity]}>
                      {b.severity}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {b.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "bad" | "warn" }) {
  const cls =
    tone === "bad"
      ? "text-red-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-foreground";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-semibold ${cls}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
