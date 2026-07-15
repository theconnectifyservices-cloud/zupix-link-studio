import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { readResources, type ResourceSnapshot } from "../resources";
import { useObservabilityStore } from "../observability.store";

export function ResourceMonitor() {
  const [snap, setSnap] = useState<ResourceSnapshot | null>(null);
  const requests = useObservabilityStore((s) => s.requests);

  const refresh = () => void readResources().then(setSnap);
  useEffect(() => { refresh(); }, []);

  const memPct = snap?.memoryUsedMb && snap.memoryLimitMb ? (snap.memoryUsedMb / snap.memoryLimitMb) * 100 : 0;
  const storagePct = snap?.storageUsedMb && snap?.storageQuotaMb ? (snap.storageUsedMb / snap.storageQuotaMb) * 100 : 0;
  const apiCount = requests.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Resource Monitoring</h2>
          <p className="text-sm text-muted-foreground">Storage, memory, bandwidth and cache footprint.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Memory (JS heap)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {snap?.memoryUsedMb != null ? `${snap.memoryUsedMb.toFixed(1)} MB` : "n/a"}
            </div>
            {snap?.memoryLimitMb && (
              <>
                <Progress value={memPct} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">of {snap.memoryLimitMb.toFixed(0)} MB limit</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Storage</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {snap?.storageUsedMb != null ? `${snap.storageUsedMb.toFixed(1)} MB` : "n/a"}
            </div>
            {snap?.storageQuotaMb && (
              <>
                <Progress value={storagePct} className="mt-2" />
                <p className="mt-1 text-xs text-muted-foreground">of {snap.storageQuotaMb.toFixed(0)} MB quota</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Bandwidth</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {snap?.bandwidthMbps != null ? `${snap.bandwidthMbps.toFixed(1)} Mbps` : "n/a"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{snap?.effectiveType ?? "unknown"} connection</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cache entries</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{snap?.cacheEntries ?? "0"}</div>
            <p className="mt-1 text-xs text-muted-foreground">Across all service-worker caches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">API requests</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{apiCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">Observed in this session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cache efficiency</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {snap?.cacheEntries && apiCount ? `${Math.min(100, Math.round((snap.cacheEntries / apiCount) * 100))}%` : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Cached vs. observed requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
