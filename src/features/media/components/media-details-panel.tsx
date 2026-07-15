import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Trash2, ExternalLink, Star } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { signedUrl, softDeleteAsset, updateAsset } from "../api";
import { toggleAssetFavorite } from "../organization-api";
import { compressionRatio } from "../delivery";
import { useAssetUsages } from "../hooks";
import { humanSize } from "../types";
import type { MediaAsset } from "../types";
import { MediaThumbnail } from "./media-thumbnail";
import { VersionHistoryPanel } from "./version-history-panel";

interface Props {
  asset: MediaAsset | null;
  userId?: string;
  onClose: () => void;
}

export function MediaDetailsPanel({ asset, userId, onClose }: Props) {
  const qc = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [altText, setAltText] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const { data: usages } = useAssetUsages(asset?.id);

  useEffect(() => {
    if (asset) {
      setFileName(asset.file_name ?? "");
      setAltText(asset.alt_text ?? "");
      setTags(asset.tags.join(", "));
    }
  }, [asset]);

  if (!asset) return null;

  const save = async () => {
    setSaving(true);
    try {
      await updateAsset(asset.id, {
        file_name: fileName || null,
        alt_text: altText || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const copyUrl = async () => {
    try {
      const url = await signedUrl(asset.path, 60 * 60 * 24);
      await navigator.clipboard.writeText(url);
      toast.success("URL copied (24h signed)");
    } catch {
      toast.error("Copy failed");
    }
  };

  const openInTab = async () => {
    const url = await signedUrl(asset.path);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${asset.file_name}"? This cannot be undone.`)) return;
    try {
      await softDeleteAsset(asset.id, asset.path);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["media"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Sheet open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="min-w-0 flex-1 truncate">{asset.file_name}</SheetTitle>
            <Button
              size="icon"
              variant="ghost"
              onClick={async () => {
                await toggleAssetFavorite(asset.id, !asset.is_favorite);
                qc.invalidateQueries({ queryKey: ["media"] });
              }}
              aria-label={asset.is_favorite ? "Unfavorite" : "Favorite"}
            >
              <Star
                className={`h-4 w-4 ${asset.is_favorite ? "fill-amber-400 text-amber-400" : ""}`}
              />
            </Button>
          </div>
          <SheetDescription>{asset.mime_type}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 aspect-square overflow-hidden rounded-lg border bg-muted">
          <MediaThumbnail asset={asset} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={copyUrl}>
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy URL
          </Button>
          <Button size="sm" variant="outline" onClick={openInTab}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                const url = await signedUrl(asset.path);
                const a = document.createElement("a");
                a.href = url;
                a.download = asset.file_name ?? "download";
                a.click();
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
            </a>
          </Button>
          <Button size="sm" variant="destructive" className="ml-auto" onClick={handleDelete}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          <div>
            <Label>File name</Label>
            <Input value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div>
            <Label>Alt text</Label>
            <Textarea
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this image for accessibility & SEO"
              rows={2}
            />
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="hero, brand, 2026" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>

        <Separator className="my-4" />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Type</dt>
            <dd className="capitalize">{asset.kind}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Size</dt>
            <dd>{humanSize(asset.size_bytes)}</dd>
          </div>
          {asset.width && (
            <div>
              <dt className="text-muted-foreground">Dimensions</dt>
              <dd>
                {asset.width} × {asset.height}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Uploaded</dt>
            <dd>{new Date(asset.created_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Modified</dt>
            <dd>{new Date(asset.updated_at).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Usage</dt>
            <dd>{asset.usage_count} references</dd>
          </div>
        </dl>

        <Separator className="my-4" />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold">Optimization</h4>
            <Badge
              variant={
                asset.processing_status === "completed"
                  ? "default"
                  : asset.processing_status === "failed"
                    ? "destructive"
                    : "secondary"
              }
              className="capitalize"
            >
              {asset.processing_status}
            </Badge>
          </div>
          {(() => {
            const ratio = compressionRatio(asset);
            const original = asset.original_size_bytes ?? asset.size_bytes ?? 0;
            const optimized = asset.optimized_size_bytes ?? 0;
            const saved = original && optimized && optimized < original ? original - optimized : 0;
            return (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Original</dt>
                  <dd>{humanSize(original)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Optimized</dt>
                  <dd>{optimized ? humanSize(optimized) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Saved</dt>
                  <dd className="text-emerald-600 dark:text-emerald-400">
                    {saved ? humanSize(saved) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ratio</dt>
                  <dd>{ratio !== null ? `${Math.round((1 - ratio) * 100)}% smaller` : "—"}</dd>
                </div>
              </dl>
            );
          })()}
          {asset.variants.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                Variants ({asset.variants.length})
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {asset.variants.map((v) => (
                  <li key={v.path}>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {v.role} · {v.width}w · {v.format}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {asset.processing_error && (
            <p className="mt-2 text-xs text-destructive">Error: {asset.processing_error}</p>
          )}
        </div>

        <Separator className="my-4" />



        <div>
          <h4 className="mb-2 text-sm font-semibold">Used in</h4>
          {!usages || usages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not used on any page yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {usages.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded-md border px-2 py-1.5 text-sm">
                  <span className="truncate">{u.page?.name ?? u.page?.slug ?? "Unknown page"}</span>
                  {u.context && <Badge variant="secondary">{u.context}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {userId && (
          <>
            <Separator className="my-4" />
            <VersionHistoryPanel asset={asset} userId={userId} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
