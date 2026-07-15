import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, RotateCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { uploadAsset } from "../api";
import { ALLOWED_MIME, MAX_FILE_SIZE, humanSize } from "../types";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
}

interface Props {
  workspaceId: string;
  userId: string;
  folderId: string | null;
  compact?: boolean;
}

export function UploadDropzone({ workspaceId, userId, folderId, compact }: Props) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (item: UploadItem) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "uploading", error: undefined } : i)),
      );
      try {
        await uploadAsset({
          file: item.file,
          workspaceId,
          userId,
          folderId,
          onProgress: (pct) =>
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, progress: pct } : i))),
        });
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: "done", progress: 100 } : i)),
        );
        qc.invalidateQueries({ queryKey: ["media"] });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "error", error: msg } : i)));
        toast.error(`${item.file.name}: ${msg}`);
      }
    },
    [workspaceId, userId, folderId, qc],
  );

  const enqueue = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const rejected: string[] = [];
      const accepted: UploadItem[] = [];
      for (const f of list) {
        if (!ALLOWED_MIME[f.type]) {
          rejected.push(`${f.name} (unsupported type)`);
          continue;
        }
        if (f.size > MAX_FILE_SIZE) {
          rejected.push(`${f.name} (over ${humanSize(MAX_FILE_SIZE)})`);
          continue;
        }
        accepted.push({
          id: crypto.randomUUID(),
          file: f,
          progress: 0,
          status: "queued",
        });
      }
      if (rejected.length) toast.error(`Skipped: ${rejected.join(", ")}`);
      if (!accepted.length) return;
      setItems((prev) => [...accepted, ...prev]);
      // Fire uploads with light concurrency (3 at a time)
      const runQueue = async () => {
        const parallel = 3;
        for (let i = 0; i < accepted.length; i += parallel) {
          await Promise.all(accepted.slice(i, i + parallel).map(upload));
        }
      };
      void runQueue();
    },
    [upload],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) enqueue(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        } ${compact ? "p-4" : "p-8"}`}
      >
        <UploadCloud className={`${compact ? "h-6 w-6" : "h-10 w-10"} text-muted-foreground`} />
        <p className="mt-2 text-sm font-medium">
          {dragOver ? "Drop files to upload" : "Drop files here or click to browse"}
        </p>
        {!compact && (
          <p className="mt-1 text-xs text-muted-foreground">
            Images, video, audio, PDF, docs · up to {humanSize(MAX_FILE_SIZE)} each
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={Object.keys(ALLOWED_MIME).join(",")}
          onChange={(e) => e.target.files && enqueue(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <ul className="max-h-64 space-y-2 overflow-auto rounded-md border p-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded px-2 py-1.5 text-sm">
              {item.status === "done" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              ) : item.status === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              ) : (
                <UploadCloud className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate">{item.file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {humanSize(item.file.size)}
                  </span>
                </div>
                {item.status === "uploading" && (
                  <Progress value={item.progress} className="mt-1 h-1" />
                )}
                {item.status === "error" && (
                  <p className="text-xs text-destructive">{item.error}</p>
                )}
              </div>
              {item.status === "error" && (
                <Button size="icon" variant="ghost" onClick={() => void upload(item)} title="Retry">
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              {item.status !== "uploading" && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
