import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Slice } from "../aggregate";

interface Props {
  title: string;
  data: Slice[];
  emptyLabel?: string;
  limit?: number;
  formatter?: (label: string) => string;
}

export function RankedList({ title, data, emptyLabel = "No data yet", limit = 8, formatter }: Props) {
  const top = data.slice(0, limit);
  const max = top[0]?.count ?? 1;
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3">
            {top.map((row) => (
              <li key={row.key} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate" title={row.label}>
                    {formatter ? formatter(row.label) : row.label}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{row.count.toLocaleString()}</span>
                </div>
                <Progress value={(row.count / max) * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
