/**
 * Dashboard → Mini Store.
 *
 * Manages the reusable catalog of items a workspace sells from its bio links
 * (create, edit, duplicate, hide, reorder, search) plus a lightweight
 * performance summary. No cart, inventory, shipping or order management —
 * Mini Store is intentionally a bio-link feature, not an eCommerce backend.
 */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  MousePointerClick,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { ImageField } from "@/features/builder/components/image-field";
import { usePlan } from "@/features/subscription/hooks";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  createStoreItem,
  deleteStoreItem,
  duplicateStoreItem,
  listStoreItems,
  reorderStoreItems,
  updateStoreItem,
  type StoreCatalogInput,
  type StoreCatalogItem,
} from "../store-api";
import { maxStoreItems, storeKindAllowed, storeLimitLabel } from "../store-plans";

const KINDS: [string, string][] = [
  ["digital", "Digital product"],
  ["service", "Service"],
  ["payment_link", "Payment link"],
];

const BADGES: [string, string][] = [
  ["none", "No badge"],
  ["new", "NEW"],
  ["hot", "HOT"],
  ["best_seller", "BEST SELLER"],
  ["limited", "LIMITED"],
  ["sale", "SALE"],
  ["popular", "POPULAR"],
];

const ACTIONS: [string, string][] = [
  ["buy_now", "Buy Now"],
  ["payment_link", "Payment Link"],
  ["whatsapp", "WhatsApp Order"],
  ["download", "Download"],
  ["external", "External URL"],
];

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border bg-background px-2 text-sm"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

interface StoreStat {
  views: number;
  clicks: number;
  byTitle: { title: string; views: number; clicks: number }[];
}

/** Product views / button clicks recorded by the bio page analytics pipeline. */
function useStoreAnalytics(workspaceId: string) {
  return useQuery({
    queryKey: ["store", "analytics", workspaceId],
    queryFn: async (): Promise<StoreStat> => {
      const { data, error } = await supabase
        .from("analytics_events")
        .select("click_source, link_url")
        .eq("workspace_id", workspaceId)
        .eq("block_type", "store")
        .limit(5000);
      if (error) throw error;
      const map = new Map<string, { views: number; clicks: number }>();
      let views = 0;
      let clicks = 0;
      for (const row of data ?? []) {
        const source = (row as { click_source: string | null }).click_source ?? "";
        const url = (row as { link_url: string | null }).link_url ?? "";
        const title = decodeURIComponent(url.split("/").slice(1).join("/") || "").trim();
        const key = title || "Untitled item";
        const entry = map.get(key) ?? { views: 0, clicks: 0 };
        if (source === "product_view") {
          entry.views += 1;
          views += 1;
        } else if (source) {
          entry.clicks += 1;
          clicks += 1;
        }
        map.set(key, entry);
      }
      const byTitle = [...map.entries()]
        .map(([title, v]) => ({ title, ...v }))
        .sort((a, b) => b.views + b.clicks - (a.views + a.clicks))
        .slice(0, 5);
      return { views, clicks, byTitle };
    },
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function StoreDashboard({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const { code: plan } = usePlan();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<StoreCatalogItem | "new" | null>(null);

  const itemsQ = useQuery({
    queryKey: ["store", "items", workspaceId],
    queryFn: () => listStoreItems(workspaceId),
    enabled: !!workspaceId,
  });
  const statsQ = useStoreAnalytics(workspaceId);

  const items = itemsQ.data ?? [];
  const limit = maxStoreItems(plan);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.title, i.description, i.subtitle, i.kind].some((v) => (v ?? "").toLowerCase().includes(q)),
    );
  }, [items, search]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["store", "items", workspaceId] });

  const removeM = useMutation({
    mutationFn: (id: string) => deleteStoreItem(id),
    onSuccess: () => {
      toast.success("Item deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateM = useMutation({
    mutationFn: (item: StoreCatalogItem) => duplicateStoreItem(item),
    onSuccess: () => {
      toast.success("Item duplicated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleM = useMutation({
    mutationFn: (item: StoreCatalogItem) => updateStoreItem(item.id, { hidden: !item.hidden }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const moveM = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const next = [...items];
      const target = index + dir;
      if (target < 0 || target >= next.length) return;
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row);
      await reorderStoreItems(next.map((i) => i.id));
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const canAdd = items.length < limit;

  if (itemsQ.isLoading) return <PageLoader label="Loading store items" />;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Store items"
          value={`${items.length}${Number.isFinite(limit) ? ` / ${limit}` : ""}`}
          hint={storeLimitLabel(plan)}
        />
        <StatCard
          icon={<Eye className="h-4 w-4" />}
          label="Product views"
          value={String(statsQ.data?.views ?? 0)}
        />
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Conversion clicks"
          value={String(statsQ.data?.clicks ?? 0)}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            if (!canAdd) {
              toast.error(`Your plan includes ${limit} store items. Upgrade for more.`);
              return;
            }
            setEditing("new");
          }}
        >
          <Plus className="mr-1 h-4 w-4" /> New item
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title={items.length === 0 ? "No store items yet" : "No matches"}
          description={
            items.length === 0
              ? "Create digital products, services or payment links, then add them to any bio page with the Mini Store block."
              : "Try a different search term."
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const index = items.findIndex((i) => i.id === item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-card p-3",
                  item.hidden && "opacity-60",
                )}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.cover_image ? (
                    <img
                      src={item.cover_image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{item.title}</span>
                    {item.badge !== "none" && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                        {item.badge.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {KINDS.find(([v]) => v === item.kind)?.[1] ?? item.kind}
                    {item.price != null && ` · ${item.currency}${item.price}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Move up"
                    disabled={index <= 0}
                    onClick={() => moveM.mutate({ index, dir: -1 })}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Move down"
                    disabled={index >= items.length - 1}
                    onClick={() => moveM.mutate({ index, dir: 1 })}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={item.hidden ? "Show item" : "Hide item"}
                    onClick={() => toggleM.mutate(item)}
                  >
                    {item.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Duplicate"
                    onClick={() => {
                      if (!canAdd) {
                        toast.error(`Your plan includes ${limit} store items.`);
                        return;
                      }
                      duplicateM.mutate(item);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Edit"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label="Delete"
                    onClick={() => removeM.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(statsQ.data?.byTitle.length ?? 0) > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="h-4 w-4" /> Popular products
          </div>
          <div className="space-y-2">
            {statsQ.data!.byTitle.map((row) => (
              <div key={row.title} className="flex items-center justify-between text-xs">
                <span className="truncate pr-3">{row.title}</span>
                <span className="shrink-0 text-muted-foreground">
                  {row.views} views · {row.clicks} clicks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && (
        <StoreItemDialog
          workspaceId={workspaceId}
          item={editing === "new" ? null : editing}
          plan={plan}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            invalidate();
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StoreItemDialog({
  workspaceId,
  item,
  plan,
  onClose,
  onSaved,
}: {
  workspaceId: string;
  item: StoreCatalogItem | null;
  plan: ReturnType<typeof usePlan>["code"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StoreCatalogInput>(() => ({
    kind: item?.kind ?? "service",
    title: item?.title ?? "",
    subtitle: item?.subtitle ?? "",
    description: item?.description ?? "",
    long_description: item?.long_description ?? "",
    cover_image: item?.cover_image ?? "",
    gallery: item?.gallery ?? [],
    price: item?.price ?? null,
    old_price: item?.old_price ?? null,
    currency: item?.currency ?? "₹",
    badge: item?.badge ?? "none",
    action: item?.action ?? "whatsapp",
    button_label: item?.button_label ?? "",
    url: item?.url ?? "",
    download_url: item?.download_url ?? "",
    whatsapp_number: item?.whatsapp_number ?? "",
    whatsapp_message: item?.whatsapp_message ?? "",
    hidden: item?.hidden ?? false,
  }));

  const set = <K extends keyof StoreCatalogInput>(k: K, v: StoreCatalogInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const saveM = useMutation({
    mutationFn: async () => {
      if (!form.title?.trim()) throw new Error("Title is required");
      if (!storeKindAllowed(plan, form.kind as never)) {
        throw new Error("Your plan supports services only. Upgrade to sell digital products and payment links.");
      }
      if (item) await updateStoreItem(item.id, form);
      else await createStoreItem(workspaceId, form);
    },
    onSuccess: () => {
      toast.success(item ? "Item updated" : "Item created");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gallery = form.gallery ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit store item" : "New store item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Item type</Label>
            <Select
              value={String(form.kind)}
              onChange={(v) => set("kind", v as never)}
              options={KINDS.filter(([v]) => storeKindAllowed(plan, v as never))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Short description</Label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Shown on the card"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Full description</Label>
            <Textarea
              rows={3}
              value={form.long_description ?? ""}
              onChange={(e) => set("long_description", e.target.value)}
              placeholder="Shown in the product popup"
            />
          </div>
          <ImageField
            label="Cover image"
            value={form.cover_image ?? ""}
            onChange={(url) => set("cover_image", url)}
            previewAspect="4 / 3"
          />
          <div className="space-y-1.5">
            <Label className="text-xs">Gallery images</Label>
            <div className="space-y-2">
              {gallery.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={g}
                    onChange={(e) =>
                      set(
                        "gallery",
                        gallery.map((x, xi) => (xi === i ? e.target.value : x)),
                      )
                    }
                    placeholder="https://…"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => set("gallery", gallery.filter((_, xi) => xi !== i))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => set("gallery", [...gallery, ""])}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add image URL
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Price</Label>
              <Input
                type="number"
                value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Old price</Label>
              <Input
                type="number"
                value={form.old_price ?? ""}
                onChange={(e) =>
                  set("old_price", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Currency</Label>
              <Input
                value={form.currency ?? "₹"}
                onChange={(e) => set("currency", e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Badge</Label>
              <Select value={String(form.badge)} onChange={(v) => set("badge", v)} options={BADGES} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Action button</Label>
              <Select
                value={String(form.action)}
                onChange={(v) => set("action", v as never)}
                options={ACTIONS}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Button text</Label>
            <Input
              value={form.button_label ?? ""}
              onChange={(e) => set("button_label", e.target.value)}
              placeholder="Buy now"
            />
          </div>
          {form.action === "download" ? (
            <Input
              value={form.download_url ?? ""}
              onChange={(e) => set("download_url", e.target.value)}
              placeholder="Download link (PDF, ZIP, course…)"
            />
          ) : form.action === "whatsapp" ? (
            <div className="grid gap-2">
              <Input
                value={form.whatsapp_number ?? ""}
                onChange={(e) => set("whatsapp_number", e.target.value)}
                placeholder="WhatsApp number with country code"
              />
              <Input
                value={form.whatsapp_message ?? ""}
                onChange={(e) => set("whatsapp_message", e.target.value)}
                placeholder="Pre-filled message"
              />
            </div>
          ) : (
            <Input
              value={form.url ?? ""}
              onChange={(e) => set("url", e.target.value)}
              placeholder="Destination / payment URL"
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveM.mutate()} disabled={saveM.isPending}>
            {saveM.isPending ? "Saving…" : "Save item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
