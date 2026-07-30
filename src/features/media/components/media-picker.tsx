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
import { Upload, ImageIcon, LinkIcon, Search, Loader2 } from "lucide-react";
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
import { ImageCropper, type AspectValue } from "./image-cropper";
import { isVectorImage } from "../crop";
import { useMediaAssets } from "../hooks";
import { uploadAsset, signedUrl } from "../api";
import { MediaThumbnail } from "./media-thumbnail";
import type { MediaAsset } from "../types";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";

const LONG_TTL = 60 * 60 * 24 * 365; // 1 year

export type { CropShape } from "../crop";

export interface MediaPickerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
  /** Crop config; omit to skip cropping. */
  crop?: { shape: CropShape; aspect: AspectValue; lockAspect?: boolean };
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
      if (!workspaceId || !userId) {
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
          userId,
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
    [workspaceId, userId],
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
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {pending ? (
          <CropStage
            src={pending.url}
            crop={crop}
            onCancel={() => setPending(null)}
            onDone={confirm}
            uploadCropped={async (blob, ext, mime) => {
              if (!workspaceId || !userId) return pending.url;
              const file = new File([blob], `crop-${Date.now()}.${ext}`, { type: mime });
              const asset = await uploadAsset({
                file,
                workspaceId,
                userId,
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

/**
 * Thin wrapper around the shared <ImageCropper/>: handles the "no crop
 * configured" and vector (SVG) shortcuts, then uploads the cropped result.
 */
function CropStage({
  src,
  crop,
  onCancel,
  onDone,
  uploadCropped,
}: {
  src: string;
  crop?: MediaPickerProps["crop"];
  onCancel: () => void;
  onDone: (url: string) => void;
  uploadCropped: (b: Blob, ext: string, mime: string) => Promise<string>;
}) {
  const [saving, setSaving] = useState(false);

  // SVGs stay vector — never rasterize them. Same for pickers without crop.
  const skipCrop = !crop || isVectorImage(src);
  useEffect(() => {
    if (skipCrop) onDone(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipCrop, src]);
  if (skipCrop) return null;

  return (
    <ImageCropper
      src={src}
      shape={crop!.shape}
      defaultAspect={crop!.aspect}
      lockAspect={crop!.lockAspect}
      busy={saving}
      onCancel={onCancel}
      onSkip={() => onDone(src)}
      onApply={async (result) => {
        try {
          setSaving(true);
          const url = await uploadCropped(result.blob, result.ext, result.mime);
          onDone(url);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Crop failed");
        } finally {
          setSaving(false);
        }
      }}
    />
  );
}
