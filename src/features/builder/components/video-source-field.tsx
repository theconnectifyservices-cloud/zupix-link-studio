/**
 * VideoSourceField — hero-background / block-level video picker.
 *
 * Accepts a direct MP4/WebM URL, a YouTube/Vimeo/Loom link, or an
 * uploaded/library video asset. Shows a live provider badge and inline
 * validation.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Film,
  Link2,
  Loader2,
  Trash2,
  Upload,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMediaAssets } from "@/features/media/hooks";
import { signedUrl, uploadAsset } from "@/features/media/api";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import {
  buildEmbed,
  detectVideoProvider,
  providerLabel,
} from "../video-source";

const LONG_TTL = 60 * 60 * 24 * 365;

interface Props {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Enable background-optimized embed defaults (autoplay/muted/loop). */
  background?: boolean;
}

export function VideoSourceField({ label, value, onChange, background = true }: Props) {
  const { workspace, userId } = useCurrentWorkspace();
  const workspaceId = workspace?.id;
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const provider = detectVideoProvider(value ?? "");
  const embed = value ? buildEmbed(value, { background }) : null;
  const invalid = !!value && !embed;

  const handleFile = useCallback(
    async (file: File) => {
      if (!workspaceId || !userId) {
        toast.error("Workspace not ready");
        return;
      }
      if (!file.type.startsWith("video/")) {
        toast.error("Please choose a video file");
        return;
      }
      try {
        setBusy(true);
        const asset = await uploadAsset({ file, workspaceId, userId, folderId: null });
        const url = await signedUrl(asset.path, LONG_TTL);
        onChange(url);
        toast.success("Video uploaded");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [workspaceId, userId, onChange],
  );

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>

      {/* Preview */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-md border bg-muted">
        {value && embed?.kind === "video" && (
          <video
            src={embed.src}
            muted
            loop
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        )}
        {value && embed?.kind === "iframe" && (
          <iframe
            src={embed.src}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Video preview"
          />
        )}
        {!value && <VideoIcon className="h-6 w-6 text-muted-foreground" />}
        {value && (
          <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
            {providerLabel(provider)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1 h-3.5 w-3.5" />}
          Upload
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setLibraryOpen(true)}>
          <Film className="mr-1 h-3.5 w-3.5" />
          Library
        </Button>
        {value && (
          <Button size="sm" variant="ghost" onClick={() => onChange(undefined)} className="text-destructive">
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* URL input */}
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Paste MP4, YouTube, Vimeo or Loom URL…"
          className="pl-7 text-xs"
        />
      </div>

      {invalid ? (
        <p className="text-[11px] text-destructive">
          Couldn't recognise that link. Use a direct MP4/WebM URL or a YouTube, Vimeo, or Loom link.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Supports MP4, WebM, Media Library, YouTube, Vimeo, Loom.
        </p>
      )}

      <LibraryDialog
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onPick={async (path) => {
          try {
            setBusy(true);
            const url = await signedUrl(path, LONG_TTL);
            onChange(url);
            setLibraryOpen(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load video");
          } finally {
            setBusy(false);
          }
        }}
        workspaceId={workspaceId}
      />
    </div>
  );
}

function LibraryDialog({
  open,
  onOpenChange,
  onPick,
  workspaceId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (path: string) => void;
  workspaceId?: string;
}) {
  const { data: assets = [], isLoading } = useMediaAssets({
    workspaceId,
    kind: "video",
    sort: "recent",
    limit: 60,
  });
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const a of assets.slice(0, 24)) {
        try {
          next[a.id] = await signedUrl(a.path, 60 * 60);
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setThumbs(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, assets]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Choose a video</span>
            <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : assets.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No videos yet. Upload one to get started.
          </div>
        ) : (
          <div className="grid max-h-[420px] grid-cols-3 gap-2 overflow-y-auto rounded-md border p-2">
            {assets.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onPick(a.path)}
                className="group relative aspect-video overflow-hidden rounded-md border bg-black transition hover:ring-2 hover:ring-primary"
                title={a.file_name}
              >
                {thumbs[a.id] ? (
                  <video
                    src={thumbs[a.id]}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Film className="h-5 w-5" />
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-left text-[10px] text-white">
                  {a.file_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
