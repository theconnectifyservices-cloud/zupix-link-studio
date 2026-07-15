import { HardDrive, ImageIcon, FileText, Film, Music, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStorageStats } from "../hooks";
import { humanSize, STORAGE_QUOTA } from "../types";

export function StorageDashboard({ workspaceId }: { workspaceId: string }) {
  const { data: stats, isLoading } = useStorageStats(workspaceId);
  if (isLoading || !stats)
    return <Card><CardContent className="h-32 animate-pulse" /></Card>;

  const pctUsed = Math.min(100, (stats.used / STORAGE_QUOTA) * 100);
  const remaining = Math.max(0, STORAGE_QUOTA - stats.used);
  const kinds: Array<[string, typeof ImageIcon]> = [
    ["image", ImageIcon],
    ["video", Film],
    ["audio", Music],
    ["document", FileText],
  ];
  const maxDay = Math.max(1, ...stats.uploadsLast7d);
  const savingsPct = stats.originalBytes
    ? Math.round((stats.savedBytes / stats.originalBytes) * 100)
    : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Storage</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold tabular-nums">{humanSize(stats.used)}</span>
              <span className="text-xs text-muted-foreground">
                of {humanSize(STORAGE_QUOTA)} · {humanSize(remaining)} free
              </span>
            </div>
            <Progress value={pctUsed} className="h-2" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {kinds.map(([k, Icon]) => {
              const v = stats.byKind[k];
              return (
                <div key={k} className="rounded-md border p-3">
                  <Icon className="mb-1 h-4 w-4 text-muted-foreground" />
                  <p className="text-xs capitalize text-muted-foreground">{k}s</p>
                  <p className="text-sm font-semibold tabular-nums">{v?.count ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{humanSize(v?.size ?? 0)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Optimization</CardTitle>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {humanSize(stats.savedBytes)}
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Saved by WebP · {savingsPct}% smaller
          </p>
          <dl className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>Processed</dt>
              <dd className="font-semibold text-foreground">{stats.processedCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>In progress</dt>
              <dd className="font-semibold text-foreground">{stats.pendingCount}</dd>
            </div>
            {stats.failedCount > 0 && (
              <div className="flex justify-between">
                <dt>Failed</dt>
                <dd className="font-semibold text-destructive">{stats.failedCount}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-semibold">Uploads · 7 days</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {stats.uploadsLast7d.reduce((a, b) => a + b, 0)}
          </p>
          <p className="mb-3 text-xs text-muted-foreground">Total this week</p>
          <div className="flex h-16 items-end gap-1">
            {stats.uploadsLast7d.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-primary/70"
                style={{ height: `${Math.max(4, (v / maxDay) * 100)}%` }}
                title={`${v} uploads`}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Total assets: <span className="font-semibold">{stats.count}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
