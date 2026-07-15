import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { InsightCard } from "../insights";

const ICON = {
  trophy: Trophy,
  trend: TrendingUp,
  warn: AlertTriangle,
  info: Info,
  spark: Sparkles,
} as const;

const TONE_BG: Record<InsightCard["tone"], string> = {
  positive: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  neutral: "bg-primary/10 text-primary",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function InsightCards({ cards }: { cards: InsightCard[] }) {
  if (cards.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <Lightbulb className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">Not enough data for insights yet</p>
          <p className="text-xs text-muted-foreground">
            Insights appear automatically once your page has more visitors.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((c) => {
        const Icon = ICON[c.icon];
        return (
          <Card key={c.id} className="overflow-hidden">
            <CardContent className="flex items-start gap-3 p-4">
              <div className={`shrink-0 rounded-lg p-2 ${TONE_BG[c.tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold leading-tight">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.detail}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function TrendBadge({ delta }: { delta: number }) {
  if (!isFinite(delta) || delta === 0) {
    return <span className="text-xs text-muted-foreground">no change</span>;
  }
  const up = delta > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const cls = up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${cls}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}
