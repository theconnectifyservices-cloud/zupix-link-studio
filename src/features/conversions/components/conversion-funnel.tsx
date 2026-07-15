import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelStage } from "../aggregate";

interface Props {
  stages: FunnelStage[];
}

export function ConversionFunnel({ stages }: Props) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Conversion funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {stages.map((s, i) => {
            const widthPct = (s.count / max) * 100;
            return (
              <li key={s.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{s.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {s.count.toLocaleString()}
                    {i > 0 && s.dropoffPct > 0 && (
                      <span className="ml-2 text-destructive">
                        −{s.dropoffPct.toFixed(1)}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-8 w-full rounded-md bg-muted">
                  <div
                    className="h-full rounded-md bg-primary/80 transition-all"
                    style={{ width: `${Math.max(2, widthPct)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
