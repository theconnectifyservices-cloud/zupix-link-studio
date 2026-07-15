import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { History, RotateCcw, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAssetVersions } from "../organization-hooks";
import { uploadNewVersion, restoreVersion, downloadVersion } from "../organization-api";
import { humanSize, type MediaAsset } from "../types";

interface Props {
  asset: MediaAsset;
  userId: string;
}

export function VersionHistoryPanel({ asset, userId }: Props) {
  const qc = useQueryClient();
  const { data: versions = [], isLoading, refetch } = useAssetVersions(asset.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      await uploadNewVersion({ asset, file, userId, notes: notes.trim() || undefined });
      toast.success(`Uploaded v${asset.current_version + 1}`);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["media"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setUploading(false);
    }
  };

  const restore = async (versionId: string) => {
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    if (!window.confirm(`Restore v${v.version_number}? Current file will be saved as a new version.`)) return;
    try {
      await restoreVersion(asset, v, userId);
      toast.success(`Restored v${v.version_number}`);
      qc.invalidateQueries({ queryKey: ["media"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <History className="h-4 w-4" /> Version history
        <Badge variant="secondary">v{asset.current_version} current</Badge>
      </div>

      <div className="rounded-md border p-3">
        <Textarea
          placeholder="Optional notes for this version…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mb-2"
        />
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
        />
        <Button
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          {uploading ? "Uploading…" : "Upload new version"}
        </Button>
      </div>

      <Separator />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading versions…</p>
      ) : versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No previous versions yet.</p>
      ) : (
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="rounded-md border p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">v{v.version_number}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(v.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{humanSize(v.size_bytes)}</span>
                {v.file_name && <span className="truncate">· {v.file_name}</span>}
              </div>
              {v.notes && <p className="mt-1 text-xs italic text-muted-foreground">"{v.notes}"</p>}
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="outline" onClick={() => void restore(v.id)}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Restore
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void downloadVersion(v)}>
                  <Download className="mr-1 h-3 w-3" /> Download
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
