import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Trash2, Palette, Type, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useBrandKits } from "../organization-hooks";
import {
  createBrandKit,
  updateBrandKit,
  deleteBrandKit,
  setDefaultBrandKit,
} from "../organization-api";
import { useMediaAssets } from "../hooks";
import { signedUrl } from "../api";
import type { BrandKit, BrandColor } from "../types";
import { MediaThumbnail } from "./media-thumbnail";

interface Props {
  workspaceId: string;
  userId: string;
}

const LOGO_ROLES: Array<{ key: keyof BrandKit; label: string }> = [
  { key: "logo_asset_id", label: "Primary logo" },
  { key: "dark_logo_asset_id", label: "Dark logo" },
  { key: "light_logo_asset_id", label: "Light logo" },
  { key: "favicon_asset_id", label: "Favicon" },
  { key: "social_share_asset_id", label: "Social share image" },
];

export function BrandKitManager({ workspaceId, userId }: Props) {
  const qc = useQueryClient();
  const { data: kits = [], isLoading } = useBrandKits(workspaceId);
  const [openNew, setOpenNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [active, setActive] = useState<BrandKit | null>(null);

  useEffect(() => {
    if (!active && kits.length) setActive(kits[0]);
    if (active && !kits.find((k) => k.id === active.id)) setActive(kits[0] ?? null);
  }, [kits, active]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["media", "brand-kits"] });

  const create = async () => {
    if (!newName.trim()) return;
    try {
      const kit = await createBrandKit({ workspaceId, userId, name: newName });
      toast.success("Brand kit created");
      setOpenNew(false);
      setNewName("");
      invalidate();
      setActive(kit);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const setDefault = async (k: BrandKit) => {
    await setDefaultBrandKit(workspaceId, k.id);
    toast.success(`"${k.name}" is now default`);
    invalidate();
  };

  const remove = async (k: BrandKit) => {
    if (!window.confirm(`Delete brand kit "${k.name}"?`)) return;
    await deleteBrandKit(k.id);
    toast.success("Deleted");
    invalidate();
  };

  if (isLoading) return <PageLoader label="Loading brand kits" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Brand kits</h3>
          <p className="text-sm text-muted-foreground">
            Logos, colors, typography — reusable across every bio page
          </p>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New brand kit
        </Button>
      </div>

      {kits.length === 0 ? (
        <EmptyState
          icon={<Palette className="h-8 w-8" />}
          title="No brand kits yet"
          description="Create your first brand kit to lock in colors and typography."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-1">
            {kits.map((k) => (
              <button
                key={k.id}
                onClick={() => setActive(k)}
                className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                  active?.id === k.id ? "border-primary bg-accent/30" : "hover:border-primary/40"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {k.name}
                  {k.is_default && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                </span>
                <div className="flex gap-0.5">
                  {(k.colors ?? []).slice(0, 3).map((c, i) => (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-full border"
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </button>
            ))}
          </aside>

          {active && (
            <BrandKitEditor
              kit={active}
              workspaceId={workspaceId}
              onSetDefault={() => void setDefault(active)}
              onDelete={() => void remove(active)}
              onChange={invalidate}
            />
          )}
        </div>
      )}

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New brand kit</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Name</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Main brand"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenNew(false)}>
              Cancel
            </Button>
            <Button onClick={() => void create()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Editor ---------- */

function BrandKitEditor({
  kit,
  workspaceId,
  onSetDefault,
  onDelete,
  onChange,
}: {
  kit: BrandKit;
  workspaceId: string;
  onSetDefault: () => void;
  onDelete: () => void;
  onChange: () => void;
}) {
  const [name, setName] = useState(kit.name);
  const [colors, setColors] = useState<BrandColor[]>(kit.colors ?? []);
  const [heading, setHeading] = useState(kit.typography?.headingFont ?? "Inter");
  const [body, setBody] = useState(kit.typography?.bodyFont ?? "Inter");
  const [pickerRole, setPickerRole] = useState<keyof BrandKit | null>(null);

  useEffect(() => {
    setName(kit.name);
    setColors(kit.colors ?? []);
    setHeading(kit.typography?.headingFont ?? "Inter");
    setBody(kit.typography?.bodyFont ?? "Inter");
  }, [kit]);

  const save = async () => {
    await updateBrandKit(kit.id, {
      name,
      colors,
      typography: { ...kit.typography, headingFont: heading, bodyFont: body },
    });
    toast.success("Brand kit saved");
    onChange();
  };

  const updateColor = (i: number, patch: Partial<BrandColor>) => {
    setColors((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const addColor = () =>
    setColors((prev) => [...prev, { name: `Color ${prev.length + 1}`, value: "#888888" }]);
  const removeColor = (i: number) => setColors((prev) => prev.filter((_, idx) => idx !== i));

  const pickAsset = async (assetId: string) => {
    if (!pickerRole) return;
    await updateBrandKit(kit.id, { [pickerRole]: assetId } as Partial<BrandKit>);
    toast.success("Asset attached");
    setPickerRole(null);
    onChange();
  };

  return (
    <div className="space-y-6 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-sm text-lg font-semibold" />
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSetDefault} disabled={kit.is_default}>
            <Star className="mr-1 h-3.5 w-3.5" /> {kit.is_default ? "Default" : "Set default"}
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      <Separator />

      {/* Logos */}
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 font-semibold">
          <ImageIcon className="h-4 w-4" /> Logos &amp; images
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LOGO_ROLES.map((role) => {
            const assetId = kit[role.key] as string | null | undefined;
            return (
              <div key={role.key as string} className="rounded-md border p-3">
                <p className="text-xs font-medium text-muted-foreground">{role.label}</p>
                <div className="mt-2">
                  {assetId ? (
                    <BrandAssetPreview assetId={assetId} />
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded border-2 border-dashed text-xs text-muted-foreground">
                      Not set
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPickerRole(role.key)}
                  >
                    {assetId ? "Change" : "Choose"}
                  </Button>
                  {assetId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await updateBrandKit(kit.id, { [role.key]: null } as Partial<BrandKit>);
                        onChange();
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div>
        <h4 className="mb-2 flex items-center justify-between font-semibold">
          <span className="flex items-center gap-1.5">
            <Palette className="h-4 w-4" /> Brand colors
          </span>
          <Button size="sm" variant="outline" onClick={addColor}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add color
          </Button>
        </h4>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded border p-2">
              <input
                type="color"
                value={c.value}
                onChange={(e) => updateColor(i, { value: e.target.value })}
                className="h-9 w-9 cursor-pointer rounded border"
              />
              <Input
                value={c.name}
                onChange={(e) => updateColor(i, { name: e.target.value })}
                className="flex-1"
              />
              <Input
                value={c.value}
                onChange={(e) => updateColor(i, { value: e.target.value })}
                className="w-24 font-mono text-xs"
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeColor(i)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Typography */}
      <div>
        <h4 className="mb-2 flex items-center gap-1.5 font-semibold">
          <Type className="h-4 w-4" /> Typography
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Heading font</Label>
            <Input value={heading} onChange={(e) => setHeading(e.target.value)} placeholder="Inter" />
          </div>
          <div>
            <Label>Body font</Label>
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Inter" />
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Badge variant="secondary">
          {colors.length} colors · {(kit.brand_asset_ids ?? []).length} extra assets
        </Badge>
        <Button onClick={() => void save()}>Save changes</Button>
      </div>

      {/* Asset picker */}
      <Dialog open={!!pickerRole} onOpenChange={(o) => !o && setPickerRole(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Choose an image</DialogTitle>
          </DialogHeader>
          <AssetPicker workspaceId={workspaceId} onPick={(id) => void pickAsset(id)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BrandAssetPreview({ assetId }: { assetId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await import("@/integrations/supabase/client").then((m) =>
        m.supabase.from("media_assets").select("path").eq("id", assetId).maybeSingle(),
      );
      if (data && !cancelled) {
        const u = await signedUrl(data.path);
        if (!cancelled) setUrl(u);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assetId]);
  return url ? (
    <img src={url} alt="" className="h-20 w-full rounded object-contain" />
  ) : (
    <div className="h-20 w-full animate-pulse rounded bg-muted" />
  );
}

function AssetPicker({ workspaceId, onPick }: { workspaceId: string; onPick: (id: string) => void }) {
  const { data: assets = [] } = useMediaAssets({ workspaceId, kind: "image", limit: 60 });
  return (
    <div className="grid max-h-[60vh] grid-cols-4 gap-2 overflow-auto sm:grid-cols-6">
      {assets.map((a) => (
        <button
          key={a.id}
          onClick={() => onPick(a.id)}
          className="aspect-square overflow-hidden rounded border bg-muted transition hover:ring-2 hover:ring-primary"
        >
          <MediaThumbnail asset={a} />
        </button>
      ))}
    </div>
  );
}
