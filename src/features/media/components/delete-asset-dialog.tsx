/**
 * DeleteAssetDialog — enterprise DAM delete protection.
 *
 * An asset that is referenced by any section is never deleted silently.
 * The user sees every place it is used and picks one of:
 *   • Cancel
 *   • Replace Everywhere — swap in another library asset globally
 *   • Delete Anyway
 */
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Replace, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssetUsages, useMediaAssets } from "../hooks";
import { replaceAssetEverywhere, softDeleteAsset } from "../api";
import { MediaThumbnail } from "./media-thumbnail";
import type { MediaAsset } from "../types";

interface Props {
  asset: MediaAsset | null;
  workspaceId?: string;
  onOpenChange: (open: boolean) => void;
  /** Called after the asset is deleted. */
  onDeleted?: () => void;
}

export function DeleteAssetDialog({ asset, workspaceId, onOpenChange, onDeleted }: Props) {
  const qc = useQueryClient();
  const { data: usages = [] } = useAssetUsages(asset?.id);
  const [mode, setMode] = useState<"confirm" | "replace">("confirm");
  const [busy, setBusy] = useState(false);

  const { data: candidates = [] } = useMediaAssets({
    workspaceId,
    kind: asset?.kind ?? "image",
    sort: "recent",
    limit: 60,
  });

  if (!asset) return null;
  const used = usages.length;

  const close = () => {
    setMode("confirm");
    onOpenChange(false);
  };

  const doDelete = async () => {
    try {
      setBusy(true);
      await softDeleteAsset(asset.id, asset.path);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["media"] });
      onDeleted?.();
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const doReplace = async (replacement: MediaAsset) => {
    try {
      setBusy(true);
      const pages = await replaceAssetEverywhere(asset.id, replacement);
      toast.success(`Replaced everywhere · ${pages} page(s) updated`);
      qc.invalidateQueries({ queryKey: ["media"] });
      close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Replace failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!asset} onOpenChange={(o) => (o ? undefined : close())}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            {used > 0 ? "This image is in use" : "Delete image"}
          </DialogTitle>
          <DialogDescription>
            {used > 0
              ? `This image is currently used in ${used} section${used === 1 ? "" : "s"}.`
              : `"${asset.file_name}" isn’t used anywhere. Deleting is safe.`}
          </DialogDescription>
        </DialogHeader>

        {used > 0 && mode === "confirm" && (
          <ul className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border p-2">
            {usages.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm"
              >
                <span className="min-w-0 truncate">
                  {u.page?.name ?? u.page?.slug ?? "Untitled page"}
                </span>
                {u.context && (
                  <Badge variant="secondary" className="capitalize">
                    {u.context}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        {mode === "replace" && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Pick the image that should take its place everywhere.
            </p>
            <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-md border p-2">
              {candidates
                .filter((c) => c.id !== asset.id)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={busy}
                    onClick={() => doReplace(c)}
                    className="overflow-hidden rounded-md border transition hover:ring-2 hover:ring-primary disabled:opacity-50"
                  >
                    <MediaThumbnail asset={c} width={200} />
                  </button>
                ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <div className="flex gap-2">
            {used > 0 && mode === "confirm" && (
              <Button variant="secondary" onClick={() => setMode("replace")} disabled={busy}>
                <Replace className="mr-1.5 h-4 w-4" />
                Replace Everywhere
              </Button>
            )}
            {mode === "confirm" && (
              <Button variant="destructive" onClick={doDelete} disabled={busy}>
                {busy ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 h-4 w-4" />
                )}
                {used > 0 ? "Delete Anyway" : "Delete"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
