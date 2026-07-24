/**
 * MediaFileField — universal upload + library + URL picker for
 * non-image, non-video assets (PDF, DOC, XLS, PPT, ZIP, TXT, audio…).
 *
 * The Image and Video fields have their own dedicated pickers
 * (ImageField / VideoSourceField). This one covers the remaining
 * "Upload File / Document / Audio" surfaces so no CMS input is ever
 * URL-only again.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  File as FileIcon,
  FileText,
  FileArchive,
  FileSpreadsheet,
  Loader2,
  Link2,
  Music,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaAssets } from "@/features/media/hooks";
import { signedUrl, uploadAsset } from "@/features/media/api";
import type { MediaAsset, MediaKind } from "@/features/media/types";
import { humanSize } from "@/features/media/types";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { cn } from "@/lib/utils";

const LONG_TTL = 60 * 60 * 24 * 365; // 1 year

export interface MediaFileFieldValue {
  url: string;
  name?: string;
  size?: number;
  mime?: string;
  assetId?: string;
}

interface Props {
  label: string;
  value?: string;
  fileName?: string;
  onChange: (val: MediaFileFieldValue | undefined) => void;
  /** Restrict library + accept attribute. Defaults to all non-image/video kinds. */
  kinds?: MediaKind[];
  /** HTML input accept string, e.g. ".pdf,.doc,.docx". */
  accept?: string;
  /** Text shown under the empty preview. */
  hint?: string;
  pickerTitle?: string;
}

const DEFAULT_KINDS: MediaKind[] = ["document", "audio", "other"];
const DEFAULT_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.rtf,.csv,.mp3,.wav,.ogg,.m4a,.aac,.flac";

export function MediaFileField({
  label,
  value,
  fileName,
  onChange,
  kinds = DEFAULT_KINDS,
  accept = DEFAULT_ACCEPT,
  hint,
  pickerTitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const displayName = fileName || value?.split("/").pop()?.split("?")[0] || "";

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-2">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-background text-primary">
          <FileGlyph name={displayName} />
        </div>
        <div className="min-w-0 flex-1">
          {value ? (
            <>
              <div className="truncate text-sm font-medium">{displayName || "Selected file"}</div>
              <div className="truncate text-[11px] text-muted-foreground">{value}</div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              {hint ?? "No file selected. Upload one, or choose from your Media Library."}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Upload className="mr-1 h-3.5 w-3.5" />
            {value ? "Replace" : "Choose"}
          </Button>
          {value && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(undefined)}
              className="text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowUrl((v) => !v)}
            title="Use a direct URL"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showUrl && (
        <Input
          value={value ?? ""}
          onChange={(e) =>
            onChange(
              e.target.value ? { url: e.target.value, name: displayName || undefined } : undefined,
            )
          }
          placeholder="https://…"
          className="text-xs"
        />
      )}

      <MediaFilePickerDialog
        open={open}
        onOpenChange={setOpen}
        title={pickerTitle ?? label}
        kinds={kinds}
        accept={accept}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── dialog */

function MediaFilePickerDialog({
  open,
  onOpenChange,
  title,
  kinds,
  accept,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  kinds: MediaKind[];
  accept: string;
  onSelect: (v: MediaFileFieldValue) => void;
}) {
  const { workspace, userId } = useCurrentWorkspace();
  const workspaceId = workspace?.id;
  const [tab, setTab] = useState<"upload" | "library" | "url">("upload");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");
  const [externalName, setExternalName] = useState("");

  useEffect(() => {
    if (!open) {
      setTab("upload");
      setSearch("");
      setExternalUrl("");
      setExternalName("");
    }
  }, [open]);

  // Fetch each kind and merge (hooks don't accept a kinds[] param).
  const q1 = useMediaAssets({
    workspaceId,
    kind: kinds[0],
    search: search || undefined,
    sort: "recent",
    limit: 60,
  });
  const q2 = useMediaAssets({
    workspaceId,
    kind: kinds[1],
    search: search || undefined,
    sort: "recent",
    limit: 60,
  });
  const q3 = useMediaAssets({
    workspaceId,
    kind: kinds[2],
    search: search || undefined,
    sort: "recent",
    limit: 60,
  });
  const assets = useMemo(() => {
    const merged = [...(q1.data ?? []), ...(q2.data ?? []), ...(q3.data ?? [])];
    // Dedupe by id, preserve recent-first order.
    const seen = new Set<string>();
    return merged.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));
  }, [q1.data, q2.data, q3.data]);
  const isLoading = q1.isLoading || q2.isLoading || q3.isLoading;

  const handleFile = useCallback(
    async (file: File) => {
      if (!workspaceId || !userId) {
        toast.error("Workspace not ready");
        return;
      }
      try {
        setBusy(true);
        const asset = await uploadAsset({ file, workspaceId, userId, folderId: null });
        const url = await signedUrl(asset.path, LONG_TTL);
        onSelect({
          url,
          name: asset.file_name ?? file.name,
          size: asset.size_bytes ?? file.size,
          mime: asset.mime_type ?? file.type,
          assetId: asset.id,
        });
        toast.success("Uploaded");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [workspaceId, userId, onSelect],
  );

  const pickAsset = useCallback(
    async (asset: MediaAsset) => {
      try {
        setBusy(true);
        const url = await signedUrl(asset.path, LONG_TTL);
        onSelect({
          url,
          name: asset.file_name ?? undefined,
          size: asset.size_bytes ?? undefined,
          mime: asset.mime_type ?? undefined,
          assetId: asset.id,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load file");
      } finally {
        setBusy(false);
      }
    },
    [onSelect],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="upload">
              <Upload className="mr-1 h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library">
              <FileIcon className="mr-1 h-4 w-4" />
              Library
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="mr-1 h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <UploadPane accept={accept} busy={busy} onFile={handleFile} />
          </TabsContent>

          <TabsContent value="library" className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search files…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-md border">
              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : assets.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No files yet. Upload one from the Upload tab.
                </div>
              ) : (
                <ul className="divide-y">
                  {assets.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => pickAsset(a)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-muted/60",
                          busy && "opacity-50",
                        )}
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-muted text-primary">
                          <FileGlyph name={a.file_name ?? ""} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {a.file_name || "Untitled"}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground">
                            {a.mime_type || a.kind} · {humanSize(a.size_bytes)}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-3">
            <Label className="text-xs">File URL</Label>
            <Input
              placeholder="https://…"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
            />
            <Label className="text-xs">Display name (optional)</Label>
            <Input
              placeholder="e.g. Media Kit.pdf"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Advanced: link to a file hosted elsewhere. For best reliability, upload to the Library
              instead.
            </p>
            <div className="flex justify-end">
              <Button
                disabled={!externalUrl.trim()}
                onClick={() =>
                  onSelect({
                    url: externalUrl.trim(),
                    name: externalName.trim() || undefined,
                  })
                }
              >
                <X className="mr-1 h-3.5 w-3.5 opacity-0" />
                Use URL
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────── upload pane */

function UploadPane({
  accept,
  busy,
  onFile,
}: {
  accept: string;
  busy: boolean;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
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
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center transition",
        dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
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
      <div className="text-sm font-medium">Drop file here or click to browse</div>
      <div className="text-xs text-muted-foreground">
        PDF · DOC · DOCX · XLS · XLSX · PPT · PPTX · ZIP · TXT · MP3 · WAV · OGG
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── glyph */

function FileGlyph({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext))
    return <Music className="h-5 w-5" />;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return <FileArchive className="h-5 w-5" />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet className="h-5 w-5" />;
  if (["pdf", "doc", "docx", "txt", "rtf", "ppt", "pptx"].includes(ext))
    return <FileText className="h-5 w-5" />;
  return <FileIcon className="h-5 w-5" />;
}
