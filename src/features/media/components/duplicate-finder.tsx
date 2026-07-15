import { useQueryClient } from "@tanstack/react-query";
import { Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useDuplicates } from "../organization-hooks";
import { bulkDeleteAssets } from "../organization-api";
import { humanSize } from "../types";
import { MediaThumbnail } from "./media-thumbnail";

interface Props {
  workspaceId: string;
}

export function DuplicateFinder({ workspaceId }: Props) {
  const qc = useQueryClient();
  const { data: groups = [], isLoading, refetch } = useDuplicates(workspaceId);

  const deleteExtras = async (assetIds: string[], keepId: string) => {
    if (!window.confirm(`Delete ${assetIds.length - 1} duplicate copies?`)) return;
    try {
      const toDelete = groups
        .flatMap((g) => g.assets)
        .filter((a) => assetIds.includes(a.id) && a.id !== keepId);
      await bulkDeleteAssets(toDelete);
      toast.success(`Deleted ${toDelete.length} duplicates`);
      qc.invalidateQueries({ queryKey: ["media"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (isLoading) return <PageLoader label="Scanning for duplicates" />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Duplicate detection</h3>
        <p className="text-sm text-muted-foreground">
          Assets sharing the same content hash or file name
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<Copy className="h-8 w-8" />}
          title="No duplicates found"
          description="Your media library is clean."
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <div key={`${g.reason}:${g.key}`} className="rounded-lg border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={g.reason === "hash" ? "destructive" : "secondary"}>
                    {g.reason === "hash" ? "Exact match" : "Same name"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {g.assets.length} copies · saved space if deduped:{" "}
                    {humanSize(
                      g.assets.slice(1).reduce((sum, a) => sum + (a.size_bytes ?? 0), 0),
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    void deleteExtras(
                      g.assets.map((a) => a.id),
                      g.assets[0].id,
                    )
                  }
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Keep first, delete rest
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8">
                {g.assets.map((a, i) => (
                  <div key={a.id} className="relative">
                    <div className="aspect-square overflow-hidden rounded border bg-muted">
                      <MediaThumbnail asset={a} />
                    </div>
                    {i === 0 && (
                      <Badge className="absolute left-1 top-1 text-[10px]">Keep</Badge>
                    )}
                    <p className="mt-1 truncate text-[10px] text-muted-foreground" title={a.file_name ?? ""}>
                      {a.file_name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
