/**
 * Admin panel for Bio Link add-ons: view purchased add-ons per workspace,
 * effective limits, manual adjustments and purchase history.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link2, Search, History, Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  adminListBioLinkAddons,
  adminSetBioLinkAddons,
  adminBioLinkAddonHistory,
  type AdminAddonRow,
} from "../addons.functions";
import { BIO_LINK_ADDON_PRICE_MINOR, formatPlanPrice } from "../plans";

export function BioLinkAddonsPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListBioLinkAddons);
  const setFn = useServerFn(adminSetBioLinkAddons);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [historyFor, setHistoryFor] = useState<AdminAddonRow | null>(null);

  const q = useQuery({ queryKey: ["admin", "bio-link-addons"], queryFn: () => listFn() });

  const save = useMutation({
    mutationFn: (v: { workspaceId: string; quantity: number }) => setFn({ data: v }),
    onSuccess: () => {
      toast.success("Add-on quantity updated");
      qc.invalidateQueries({ queryKey: ["admin", "bio-link-addons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const all = q.data ?? [];
    const t = query.trim().toLowerCase();
    const filtered = t ? all.filter((r) => r.workspaceName.toLowerCase().includes(t)) : all;
    return [...filtered].sort((a, b) => b.addonQuantity - a.addonQuantity);
  }, [q.data, query]);

  const totalPurchased = (q.data ?? []).reduce((s, r) => s + r.addonQuantity, 0);

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" /> Bio Link add-ons
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Total purchased: {totalPurchased} · {formatPlanPrice(BIO_LINK_ADDON_PRICE_MINOR)} each
            </Badge>
          </div>
        </div>
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search workspaces…"
            className="pl-9"
            aria-label="Search workspaces"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {q.isLoading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No workspaces found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="p-3">Workspace</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Plan limit</th>
                  <th className="p-3">Purchased</th>
                  <th className="p-3">Allowed total</th>
                  <th className="p-3">Used</th>
                  <th className="p-3">Adjust</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const draft = drafts[r.workspaceId] ?? r.addonQuantity;
                  const dirty = draft !== r.addonQuantity;
                  return (
                    <tr key={r.workspaceId} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{r.workspaceName}</td>
                      <td className="p-3 capitalize">{r.planCode}</td>
                      <td className="p-3">{r.planLimit === null ? "Unlimited" : r.planLimit}</td>
                      <td className="p-3">{r.addonQuantity}</td>
                      <td className="p-3 font-semibold">
                        {r.effectiveLimit === null ? "Unlimited" : r.effectiveLimit}
                      </td>
                      <td className="p-3">{r.used}</td>
                      <td className="p-3">
                        <Input
                          type="number"
                          min={0}
                          value={draft}
                          aria-label={`Purchased add-ons for ${r.workspaceName}`}
                          className="h-8 w-20"
                          onChange={(e) =>
                            setDrafts((d) => ({ ...d, [r.workspaceId]: Math.max(0, Number(e.target.value) || 0) }))
                          }
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant={dirty ? "default" : "ghost"}
                            disabled={!dirty || save.isPending}
                            onClick={() => save.mutate({ workspaceId: r.workspaceId, quantity: draft })}
                          >
                            {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setHistoryFor(r)} aria-label="History">
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <AddonHistoryDialog row={historyFor} onClose={() => setHistoryFor(null)} />
    </Card>
  );
}

function AddonHistoryDialog({ row, onClose }: { row: AdminAddonRow | null; onClose: () => void }) {
  const histFn = useServerFn(adminBioLinkAddonHistory);
  const q = useQuery({
    queryKey: ["admin", "bio-link-addon-history", row?.workspaceId],
    queryFn: () => histFn({ data: { workspaceId: row!.workspaceId } }),
    enabled: !!row,
  });

  return (
    <Dialog open={!!row} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add-on history · {row?.workspaceName}</DialogTitle>
        </DialogHeader>
        {q.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (q.data ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No add-on activity yet.</p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {(q.data ?? []).map((e: any) => (
              <li key={e.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {e.event_type === "addon.bio_link.purchased" ? "Purchased" : "Manual adjustment"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
                <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-muted-foreground">
                  {JSON.stringify(e.metadata ?? {}, null, 0)}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
