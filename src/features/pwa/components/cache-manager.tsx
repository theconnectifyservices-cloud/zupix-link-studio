import { HardDrive, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { APP_CONFIG } from "@/config/app.config";
import { useStorageInfo } from "../hooks";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}

export function CacheManager() {
  const { info, loading, refresh, clearAll, clearOne } = useStorageInfo();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              App version {APP_CONFIG.version}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" variant="destructive" onClick={() => void clearAll()}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {info ? (
            <>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatBytes(info.usage)} of {formatBytes(info.quota)}
                </span>
                <span className="font-medium">{info.percent.toFixed(1)}%</span>
              </div>
              <Progress value={info.percent} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Storage information unavailable.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          {info && info.caches.length > 0 ? (
            <ul className="divide-y">
              {info.caches.map((c) => (
                <li key={c.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.entries} entries</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => void clearOne(c.name)}>
                    Clear
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No caches yet. They&apos;ll appear once the service worker is active on the published site.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
