/**
 * MediaPicker — universal image picker used by the builder.
 *
 * Modes:
 *  • Library — browse existing workspace media
 *  • Upload  — drag-drop / file-picker / paste from clipboard
 *  • URL     — advanced: paste an external URL
 *
 * On confirm, resolves to a long-lived signed URL (1 year) so the value
 * can be persisted in block content and rendered on published pages.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Upload, ImageIcon, LinkIcon, Search, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useMediaAssets } from "../hooks";
import { uploadAsset, signedUrl } from "../api";
import { MediaThumbnail } from "./media-thumbnail";
import type { MediaAsset } from "../types";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";

const LONG_TTL = 60 * 60 * 24 * 365; // 1 year

export type CropShape = "round" | "rect";

export interface MediaPickerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
  /** Crop config; omit to skip cropping. */
  crop?: { shape: CropShape; aspect: number | "free" };
}

export function MediaPicker({
  open,
  onOpenChange,
  onSelect,
  title = "Select image",
  crop,
}: MediaPickerProps) {
  const { workspace, userId } = useCurrentWorkspace();
  const workspaceId = workspace?.id;

  const [tab, setTab] = useState<"library" | "upload" | "url">("library");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<{ url: string; assetId?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");

  const { data: assets = [], isLoading } = useMediaAssets({
    workspaceId,
    kind: "image",
    search: search || undefined,
    sort: "recent",
    limit: 60,
  });

  useEffect(() => {
    if (!open) {
      setPending(null);
      setExternalUrl("");
      setSearch("");
      setTab("library");
    }
  }, [open]);

  const handleAsset = useCallback(async (asset: MediaAsset) => {
    try {
      setBusy(true);
      const url = await signedUrl(asset.path, LONG_TTL);
      setPending({ url, assetId: asset.id });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load image");
    } finally {
      setBusy(false);
    }
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!workspaceId || !user) {
        toast.error("Workspace not ready");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please choose an image file");
        return;
      }
      try {
        setBusy(true);
        const asset = await uploadAsset({
          file,
          workspaceId,
          userId: user.id,
          folderId: null,
        });
        const url = await signedUrl(asset.path, LONG_TTL);
        setPending({ url, assetId: asset.id });
        toast.success("Uploaded");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [workspaceId, user],
  );

  const confirm = useCallback(
    (finalUrl: string) => {
      onSelect(finalUrl);
      onOpenChange(false);
    },
    [onSelect, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {pending ? (
          <CropStage
            src={pending.url}
            crop={crop}
            onCancel={() => setPending(null)}
            onDone={confirm}
            onSkip={() => confirm(pending.url)}
            uploadCropped={async (blob) => {
              if (!workspaceId || !user) return pending.url;
              const file = new File([blob], `crop-${Date.now()}.webp`, { type: "image/webp" });
              const asset = await uploadAsset({
                file,
                workspaceId,
                userId: user.id,
                folderId: null,
              });
              return signedUrl(asset.path, LONG_TTL);
            }}
          />
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="library">
                <ImageIcon className="mr-1 h-4 w-4" />
                Library
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="mr-1 h-4 w-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="mr-1 h-4 w-4" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Search media…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="grid max-h-[420px] grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2">
                {isLoading ? (
                  <div className="col-span-4 flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : assets.length === 0 ? (
                  <div className="col-span-4 py-10 text-center text-sm text-muted-foreground">
                    No images yet. Upload one from the Upload tab.
                  </div>
                ) : (
                  assets.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      disabled={busy}
                      onClick={() => handleAsset(a)}
                      className="group relative aspect-square overflow-hidden rounded-md border transition hover:ring-2 hover:ring-primary disabled:opacity-50"
                    >
                      <MediaThumbnail asset={a} width={200} />
                    </button>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="upload">
              <UploadPane onFile={handleFile} busy={busy} />
            </TabsContent>

            <TabsContent value="url" className="space-y-3">
              <Label className="text-xs">Image URL</Label>
              <Input
                placeholder="https://…"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Advanced: link an external image. For best performance, upload to the Library
                instead.
              </p>
              <DialogFooter>
                <Button
                  disabled={!externalUrl.trim()}
                  onClick={() => {
                    const url = externalUrl.trim();
                    if (crop) setPending({ url });
                    else confirm(url);
                  }}
                >
                  Use URL
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Upload pane -------------------- */

function UploadPane({ onFile, busy }: { onFile: (f: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Paste from clipboard while pane is mounted
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of Array.from(items)) {
        if (it.type.startsWith("image/")) {
          const f = it.getAsFile();
          if (f) {
            onFile(f);
            e.preventDefault();
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition ${
        dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {busy ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      ) : (
        <Upload className="h-8 w-8 text-muted-foreground" />
      )}
      <div className="text-sm font-medium">Drop image here, click to browse, or paste (⌘V)</div>
      <div className="text-xs text-muted-foreground">
        PNG · JPG · WebP · GIF · SVG — auto-compressed to WebP with responsive variants
      </div>
    </div>
  );
}

/* -------------------- Crop stage -------------------- */

function CropStage({
  src,
  crop,
  onCancel,
  onDone,
  onSkip,
  uploadCropped,
}: {
  src: string;
  crop?: MediaPickerProps["crop"];
  onCancel: () => void;
  onDone: (url: string) => void;
  onSkip: () => void;
  uploadCropped: (b: Blob) => Promise<string>;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const aspect =
    !crop || crop.aspect === "free" ? undefined : (crop.aspect as number);

  if (!crop) {
    // No crop configured — commit immediately.
    onDone(src);
    return null;
  }

  const save = async () => {
    if (!area) {
      onDone(src);
      return;
    }
    try {
      setSaving(true);
      const blob = await getCroppedBlob(src, area, rotation, flipH, flipV);
      const url = await uploadCropped(blob);
      onDone(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Crop failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative h-[360px] w-full overflow-hidden rounded-md border bg-muted">
        <Cropper
          image={src}
          crop={pos}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          cropShape={crop.shape}
          transform={`translate(${pos.x}px, ${pos.y}px) rotate(${rotation}deg) scale(${
            flipH ? -1 : 1
          }, ${flipV ? -1 : 1}) scale(${zoom})`}
          onCropChange={setPos}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, a) => setArea(a)}
          showGrid
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Zoom</Label>
          <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
        </div>
        <div>
          <Label className="text-xs">Rotate</Label>
          <Slider
            min={0}
            max={360}
            step={1}
            value={[rotation]}
            onValueChange={(v) => setRotation(v[0])}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setFlipH((v) => !v)}>
          Flip H
        </Button>
        <Button size="sm" variant="outline" onClick={() => setFlipV((v) => !v)}>
          Flip V
        </Button>
        <Button size="sm" variant="outline" onClick={() => setRotation((r) => (r + 90) % 360)}>
          Rotate 90°
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setPos({ x: 0, y: 0 });
            setZoom(1);
            setRotation(0);
            setFlipH(false);
            setFlipV(false);
          }}
        >
          Reset
        </Button>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={saving}>
          Skip crop
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Apply
        </Button>
      </DialogFooter>
    </div>
  );
}

/* -------------------- Crop utility -------------------- */

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedBlob(
  src: string,
  area: Area,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
): Promise<Blob> {
  const image = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const bWidth = image.width * cos + image.height * sin;
  const bHeight = image.width * sin + image.height * cos;

  const bCanvas = document.createElement("canvas");
  bCanvas.width = bWidth;
  bCanvas.height = bHeight;
  const bCtx = bCanvas.getContext("2d")!;
  bCtx.translate(bWidth / 2, bHeight / 2);
  bCtx.rotate(rad);
  bCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  bCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const out = document.createElement("canvas");
  out.width = Math.round(area.width);
  out.height = Math.round(area.height);
  const oCtx = out.getContext("2d")!;
  oCtx.drawImage(
    bCanvas,
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
    0,
    0,
    Math.round(area.width),
    Math.round(area.height),
  );

  return await new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/webp", 0.9),
  );
}
