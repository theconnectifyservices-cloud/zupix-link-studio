import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useFindingsStore, type Finding, type Severity } from "../findings.store";
import { computeSecurityScore } from "../score";
import { runSecurityScan } from "../checks";
import { useAuditLogStore } from "../audit-log.store";

const SEV_COLORS: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  info: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export function SecurityDashboard() {
  const findings = useFindingsStore((s) => s.findings);
  const setAll = useFindingsStore((s) => s.setAll);
  const resolve = useFindingsStore((s) => s.resolve);
  const ignore = useFindingsStore((s) => s.ignore);
  const reopen = useFindingsStore((s) => s.reopen);
  const audit = useAuditLogStore((s) => s.entries);

  const score = useMemo(() => computeSecurityScore(findings), [findings]);

  const grouped = useMemo(() => {
    const g: Record<string, Finding[]> = {};
    for (const f of findings) (g[f.category] ??= []).push(f);
    return g;
  }, [findings]);

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold tracking-tight">{score.score}</span>
              <Badge variant="outline" className="mb-2">
                Grade {score.grade}
              </Badge>
            </div>
            <Progress value={score.score} className="mt-4 h-2" />
            <p className="mt-3 text-xs text-muted-foreground">
              {score.resolved} controls verified · {score.open} open · {score.critical} critical
            </p>
          </CardContent>
        </Card>

        <StatCard icon={<XCircle className="h-4 w-4 text-red-400" />} label="Critical" value={score.critical} />
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-yellow-400" />} label="Warnings" value={score.warnings} />
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setAll(runSecurityScan())}>
          <RefreshCw className="mr-2 h-4 w-4" /> Re-run scan
        </Button>
      </div>

      {/* Findings by category */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-sm capitalize">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((f) => (
                <div
                  key={f.id}
                  className="rounded-md border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {f.status === "resolved" ? (
                        <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                      ) : f.status === "ignored" ? (
                        <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ShieldAlert className="mt-0.5 h-4 w-4 text-orange-400" />
                      )}
                      <div>
                        <div className="text-sm font-medium">{f.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{f.description}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          <span className="text-foreground/80">Recommendation:</span> {f.recommendation}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={SEV_COLORS[f.severity]}>
                      {f.severity}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    {f.status !== "resolved" && (
                      <Button size="sm" variant="ghost" onClick={() => resolve(f.id)}>
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark resolved
                      </Button>
                    )}
                    {f.status === "open" && (
                      <Button size="sm" variant="ghost" onClick={() => ignore(f.id)}>
                        Ignore
                      </Button>
                    )}
                    {f.status !== "open" && (
                      <Button size="sm" variant="ghost" onClick={() => reopen(f.id)}>
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet — auth events will appear here.</p>
          ) : (
            <ScrollArea className="h-64">
              <ul className="space-y-1 text-xs">
                {audit.map((e) => (
                  <li key={e.id} className="flex items-center justify-between border-b border-border/40 py-1">
                    <span>
                      <Badge variant="outline" className="mr-2 capitalize">{e.category}</Badge>
                      <span className="font-medium">{e.action}</span>
                      {e.actor ? <span className="ml-2 text-muted-foreground">by {e.actor}</span> : null}
                    </span>
                    <span className="text-muted-foreground">{new Date(e.at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
