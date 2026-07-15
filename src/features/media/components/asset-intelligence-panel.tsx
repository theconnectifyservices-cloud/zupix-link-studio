import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Archive,
  BarChart3,
  HardDrive,
  Link2Off,
  Palette,
  Recycle,
  Repeat,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { MediaThumbnail } from "./media-thumbnail";
import {
  useAssetInsights,
  useStorageAnalytics,
  useUsageAnalytics,
  useBrokenReferences,
  useBrandConsistency,
  useHealthReport,
  useArchivedAssets,
  useTrashedAssets,
  useTrashRetention,
  useIntelligenceMutations,
} from "../intelligence-hooks";
import { useMediaAssets } from "../hooks";
import { humanSize, type MediaAsset } from "../types";

interface Props {
  workspaceId: string;
}

export function AssetIntelligencePanel({ workspaceId }: Props) {
  return (
    <Tabs defaultValue="insights" className="w-full">
      <TabsList className="flex w-full flex-wrap">
        <TabsTrigger value="insights"><Activity className="mr-1.5 h-3.5 w-3.5" /> Insights</TabsTrigger>
        <TabsTrigger value="storage"><HardDrive className="mr-1.5 h-3.5 w-3.5" /> Storage</TabsTrigger>
        <TabsTrigger value="usage"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> Usage</TabsTrigger>
        <TabsTrigger value="replace"><Repeat className="mr-1.5 h-3.5 w-3.5" /> Global Replace</TabsTrigger>
        <TabsTrigger value="broken"><Link2Off className="mr-1.5 h-3.5 w-3.5" /> Broken</TabsTrigger>
        <TabsTrigger value="brand"><Palette className="mr-1.5 h-3.5 w-3.5" /> Brand</TabsTrigger>
        <TabsTrigger value="lifecycle"><Archive className="mr-1.5 h-3.5 w-3.5" /> Archive &amp; Trash</TabsTrigger>
        <TabsTrigger value="health"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Health</TabsTrigger>
      </TabsList>

      <TabsContent value="insights" className="mt-4"><InsightsTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="storage" className="mt-4"><StorageTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="usage" className="mt-4"><UsageTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="replace" className="mt-4"><ReplaceTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="broken" className="mt-4"><BrokenTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="brand" className="mt-4"><BrandTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="lifecycle" className="mt-4"><LifecycleTab workspaceId={workspaceId} /></TabsContent>
      <TabsContent value="health" className="mt-4"><HealthTab workspaceId={workspaceId} /></TabsContent>
    </Tabs>
  );
}

/* ---------------- INSIGHTS ---------------- */

function InsightsTab({ workspaceId }: Props) {
  const { data, isLoading } = useAssetInsights(workspaceId);
  if (isLoading || !data) return <PageLoader label="Analyzing library" />;
  const stats: Array<[string, number]> = [
    ["Total assets", data.total],
    ["Images", data.images],
    ["Videos", data.videos],
    ["Audio", data.audio],
    ["Documents", data.documents],
    ["PDFs", data.pdfs],
    ["SVGs", data.svgs],
    ["Archived", data.archived],
    ["In trash", data.trashed],
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map(([label, value]) => (
        <Card key={label}>
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- STORAGE ---------------- */

function StorageTab({ workspaceId }: Props) {
  const { data, isLoading } = useStorageAnalytics(workspaceId);
  if (isLoading || !data) return <PageLoader label="Computing storage analytics" />;
  const max = Math.max(1, ...data.trend.map((t) => t.bytes));
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Used</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{humanSize(data.used)}</p>
            <p className="text-xs text-muted-foreground">of {humanSize(data.quota)}</p>
            <Progress value={data.pctUsed} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Free</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{humanSize(data.free)}</p>
            <p className="text-xs text-muted-foreground">{(100 - data.pctUsed).toFixed(1)}% available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly growth</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{humanSize(data.monthlyGrowth)}</p>
            <p className={`text-xs ${data.monthlyGrowthPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
              {data.monthlyGrowthPct >= 0 ? "+" : ""}{data.monthlyGrowthPct}% vs prev 30d
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">Uploads · last 30 days</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-32 items-end gap-1">
            {data.trend.map((d) => (
              <div
                key={d.date}
                className="flex-1 rounded-t bg-primary/70"
                style={{ height: `${Math.max(2, (d.bytes / max) * 100)}%` }}
                title={`${d.date}: ${humanSize(d.bytes)} · ${d.count} files`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Top 10 largest assets</CardTitle></CardHeader>
        <CardContent className="p-0">
          <AssetList assets={data.largest} showSize />
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- USAGE ---------------- */

function UsageTab({ workspaceId }: Props) {
  const { data, isLoading } = useUsageAnalytics(workspaceId);
  if (isLoading || !data) return <PageLoader label="Computing usage analytics" />;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-sm">Most used</CardTitle></CardHeader>
        <CardContent className="p-0"><AssetList assets={data.mostUsed} showUsage /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Recently used</CardTitle></CardHeader>
        <CardContent className="p-0"><AssetList assets={data.recentlyUsed} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Recently uploaded</CardTitle></CardHeader>
        <CardContent className="p-0"><AssetList assets={data.recentlyUploaded} /></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-sm">Unused ({data.unused.length})</CardTitle></CardHeader>
        <CardContent className="p-0"><AssetList assets={data.unused} showSize /></CardContent>
      </Card>
    </div>
  );
}

/* ---------------- GLOBAL REPLACE ---------------- */

function ReplaceTab({ workspaceId }: Props) {
  const { data: assets = [] } = useMediaAssets({
    workspaceId, folderId: null, kind: null, search: "", onlyUnused: false, sort: "recent", limit: 200,
  });
  const { globalReplace } = useIntelligenceMutations(workspaceId);
  const [oldId, setOldId] = useState<string>("");
  const [newId, setNewId] = useState<string>("");

  const onRun = async () => {
    if (!oldId || !newId || oldId === newId) return;
    try {
      const res = await globalReplace.mutateAsync({ oldAssetId: oldId, newAssetId: newId });
      toast.success(`Replaced across ${res.pagesUpdated} page(s) · ${res.usagesUpdated} reference(s)`);
      setOldId(""); setNewId("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Replacement failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Global asset replacement</CardTitle>
        <p className="text-xs text-muted-foreground">
          Swap every reference to one asset with another across every bio page in this workspace.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium">Replace this asset</p>
            <AssetPicker assets={assets} value={oldId} onChange={setOldId} />
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">With this asset</p>
            <AssetPicker assets={assets} value={newId} onChange={setNewId} />
          </div>
        </div>
        <Button
          onClick={() => void onRun()}
          disabled={!oldId || !newId || oldId === newId || globalReplace.isPending}
        >
          <Zap className="mr-1.5 h-4 w-4" />
          {globalReplace.isPending ? "Replacing…" : "Replace everywhere"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AssetPicker({
  assets, value, onChange,
}: { assets: MediaAsset[]; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select an asset…" /></SelectTrigger>
      <SelectContent className="max-h-64">
        {assets.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.file_name} · {humanSize(a.size_bytes)} · used {a.usage_count}×
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------------- BROKEN ---------------- */

function BrokenTab({ workspaceId }: Props) {
  const { data = [], isLoading } = useBrokenReferences(workspaceId);
  const { pruneBroken } = useIntelligenceMutations(workspaceId);
  if (isLoading) return <PageLoader label="Scanning references" />;
  if (!data.length) {
    return <EmptyState title="No broken references" description="Every asset reference in your pages points to a healthy file." />;
  }
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm">{data.length} broken reference(s)</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            try {
              await pruneBroken.mutateAsync(data.map((r) => r.usage_id));
              toast.success("Broken references cleaned up");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Failed");
            }
          }}
        >
          <Recycle className="mr-1.5 h-3.5 w-3.5" /> Prune all
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Page</th>
              <th className="px-3 py-2 text-left">Asset id</th>
              <th className="px-3 py-2 text-left">Reason</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.usage_id} className="border-t">
                <td className="px-3 py-2">{r.page_name ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.asset_id.slice(0, 8)}…</td>
                <td className="px-3 py-2"><Badge variant="destructive">{r.reason}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ---------------- BRAND ---------------- */

function BrandTab({ workspaceId }: Props) {
  const { data, isLoading } = useBrandConsistency(workspaceId);
  if (isLoading || !data) return <PageLoader label="Checking brand" />;
  const rows: Array<[string, boolean | number, string?]> = [
    ["Brand kit configured", data.hasBrandKit],
    ["Logo configured", data.logoConfigured],
    ["Color palette (3+)", data.colorsConfigured],
    ["Fonts configured", data.fontsConfigured],
    ["Brand assets", data.brandAssetCount],
    ["Off-brand images", data.offBrandAssets, "Images not tagged as part of the brand kit"],
    ["Images missing alt text", data.missingAltText, "Reduces accessibility &amp; SEO"],
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-sm">Brand score</CardTitle></CardHeader>
        <CardContent>
          <p className="text-4xl font-bold tabular-nums">{data.score}<span className="text-lg text-muted-foreground">/100</span></p>
          <Progress value={data.score} className="mt-2 h-2" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <ul className="divide-y">
            {rows.map(([label, value, hint]) => (
              <li key={label} className="flex items-start justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{label}</p>
                  {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
                </div>
                <div className="tabular-nums">
                  {typeof value === "boolean" ? (
                    <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>
                  ) : (
                    <span className="font-semibold">{value}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- LIFECYCLE ---------------- */

function LifecycleTab({ workspaceId }: Props) {
  const archived = useArchivedAssets(workspaceId);
  const trashed = useTrashedAssets(workspaceId);
  const retention = useTrashRetention(workspaceId);
  const { restoreArchived, restoreTrashed, permanentDelete, setRetention } = useIntelligenceMutations(workspaceId);
  const [days, setDays] = useState<string>("");

  const retentionValue = retention.data ?? 30;
  const currentDays = days || String(retentionValue);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Trash retention</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-2 text-xs text-muted-foreground">
            Items in the trash are permanently deleted after this many days.
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              min={1}
              max={365}
              value={currentDays}
              onChange={(e) => setDays(e.target.value)}
              className="w-32"
            />
            <Button
              onClick={async () => {
                const n = Number(currentDays);
                if (!Number.isFinite(n) || n < 1) return;
                await setRetention.mutateAsync(n);
                toast.success(`Retention set to ${n} days`);
                setDays("");
              }}
            >Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Archived · {archived.data?.length ?? 0}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {archived.isLoading ? <PageLoader label="Loading" /> : !archived.data?.length ? (
            <p className="text-sm text-muted-foreground">No archived assets.</p>
          ) : archived.data.map((a) => (
            <RowAction
              key={a.id}
              asset={a}
              actionLabel="Restore"
              icon={<Undo2 className="mr-1.5 h-3.5 w-3.5" />}
              onAction={async () => { await restoreArchived.mutateAsync([a.id]); toast.success("Restored"); }}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Trash · {trashed.data?.length ?? 0}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {trashed.isLoading ? <PageLoader label="Loading" /> : !trashed.data?.length ? (
            <p className="text-sm text-muted-foreground">Trash is empty.</p>
          ) : trashed.data.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-md border p-2">
              <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                <MediaThumbnail asset={a} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.file_name}</p>
                <p className="text-xs text-muted-foreground">{humanSize(a.size_bytes)}</p>
              </div>
              <Button size="sm" variant="outline" onClick={async () => {
                await restoreTrashed.mutateAsync([a.id]); toast.success("Restored");
              }}><Undo2 className="mr-1.5 h-3.5 w-3.5" /> Restore</Button>
              <Button size="sm" variant="destructive" onClick={async () => {
                if (!window.confirm("Permanently delete? This cannot be undone.")) return;
                await permanentDelete.mutateAsync([a]);
                toast.success("Permanently deleted");
              }}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RowAction({
  asset, actionLabel, icon, onAction,
}: { asset: MediaAsset; actionLabel: string; icon: React.ReactNode; onAction: () => void | Promise<void> }) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-2">
      <div className="h-10 w-10 overflow-hidden rounded bg-muted">
        <MediaThumbnail asset={asset} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{asset.file_name}</p>
        <p className="text-xs text-muted-foreground">{humanSize(asset.size_bytes)}</p>
      </div>
      <Button size="sm" variant="outline" onClick={() => void onAction()}>{icon}{actionLabel}</Button>
    </div>
  );
}

/* ---------------- HEALTH ---------------- */

function HealthTab({ workspaceId }: Props) {
  const { data, isLoading } = useHealthReport(workspaceId);
  if (isLoading || !data) return <PageLoader label="Scoring library" />;
  const scores: Array<[string, number, string]> = [
    ["Optimization", data.optimization, "Assets processed &amp; WebP-ready"],
    ["Usage", data.usage, "Assets that are actually referenced"],
    ["Storage", data.storage, "Share of assets under 5MB"],
    ["Brand", data.brand, "Brand kit completeness"],
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">Overall health</CardTitle>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-5xl font-bold tabular-nums">{data.overall}<span className="text-xl text-muted-foreground">/100</span></p>
          <Progress value={data.overall} className="mt-3 h-2" />
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {scores.map(([label, value, hint]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase text-muted-foreground">{label}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
              <Progress value={value} className="mt-2 h-1.5" />
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Findings</CardTitle></CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="flex justify-between rounded-md border px-3 py-2"><span>Processed</span><span className="tabular-nums">{data.breakdown.processed}</span></li>
            <li className="flex justify-between rounded-md border px-3 py-2"><span>Unprocessed / failed</span><span className="tabular-nums">{data.breakdown.unprocessed}</span></li>
            <li className="flex justify-between rounded-md border px-3 py-2"><span>Unused</span><span className="tabular-nums">{data.breakdown.unused}</span></li>
            <li className="flex justify-between rounded-md border px-3 py-2"><span>Oversized (&gt; 5MB)</span><span className="tabular-nums">{data.breakdown.oversized}</span></li>
            <li className="flex justify-between rounded-md border px-3 py-2"><span>Duplicate copies</span><span className="tabular-nums">{data.breakdown.duplicates}</span></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- SHARED ---------------- */

function AssetList({
  assets, showSize, showUsage,
}: { assets: MediaAsset[]; showSize?: boolean; showUsage?: boolean }) {
  const rows = useMemo(() => assets.slice(0, 20), [assets]);
  if (!rows.length) return <p className="p-4 text-sm text-muted-foreground">Nothing to show.</p>;
  return (
    <ul className="divide-y">
      {rows.map((a) => (
        <li key={a.id} className="flex items-center gap-3 px-3 py-2">
          <div className="h-9 w-9 overflow-hidden rounded bg-muted">
            <MediaThumbnail asset={a} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{a.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {showSize && <>{humanSize(a.size_bytes)} · </>}
              {showUsage && <>{a.usage_count}× used · </>}
              {new Date(a.created_at).toLocaleDateString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
