import { useMemo, useState } from "react";
import { Search, Grid3x3, List, FolderInput } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useMediaAssets, useMediaFolders } from "../hooks";
import { moveAssets } from "../api";
import { humanSize, type MediaAsset, type MediaKind } from "../types";
import { UploadDropzone } from "./upload-dropzone";
import { FolderTree } from "./folder-tree";
import { MediaThumbnail } from "./media-thumbnail";
import { MediaDetailsPanel } from "./media-details-panel";
import { StorageDashboard } from "./storage-dashboard";

type FilterKey = "all" | "image" | "video" | "audio" | "document" | "svg" | "recent" | "largest" | "unused";
type ViewMode = "grid" | "list";
type SortKey = "recent" | "largest" | "name";

interface Props {
  workspaceId: string;
  userId: string;
}

export function MediaLibrary({ workspaceId, userId }: Props) {
  const qc = useQueryClient();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("recent");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: folders = [] } = useMediaFolders(workspaceId);

  // Filter → API params
  const apiParams = useMemo(() => {
    const kind: MediaKind | "svg" | null =
      filter === "image" || filter === "video" || filter === "audio" || filter === "document"
        ? (filter as MediaKind)
        : filter === "svg"
          ? "svg"
          : null;
    const effectiveSort: SortKey =
      filter === "largest" ? "largest" : filter === "recent" ? "recent" : sort;
    return {
      workspaceId,
      folderId: filter === "all" || filter === "unused" || filter === "recent" || filter === "largest" ? folderId : folderId,
      kind,
      search,
      onlyUnused: filter === "unused",
      sort: effectiveSort,
      limit: 120,
    };
  }, [workspaceId, folderId, filter, search, sort]);

  const { data: assets = [], isLoading } = useMediaAssets(apiParams);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleMove = async (targetFolderId: string | null) => {
    try {
      await moveAssets(Array.from(selectedIds), targetFolderId);
      toast.success(`Moved ${selectedIds.size} file(s)`);
      clearSelection();
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <StorageDashboard workspaceId={workspaceId} />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-4">
          <UploadDropzone workspaceId={workspaceId} userId={userId} folderId={folderId} compact />
          <FolderTree
            workspaceId={workspaceId}
            userId={userId}
            folders={folders}
            selectedId={folderId}
            onSelect={setFolderId}
          />
        </aside>

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, alt text..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="largest">Largest first</SelectItem>
                <SelectItem value="name">Name (A–Z)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-md border">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setView("grid")}
                className="rounded-r-none"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setView("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKey)}>
            <TabsList className="flex w-full flex-wrap">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="image">Images</TabsTrigger>
              <TabsTrigger value="video">Videos</TabsTrigger>
              <TabsTrigger value="audio">Audio</TabsTrigger>
              <TabsTrigger value="document">Docs</TabsTrigger>
              <TabsTrigger value="svg">SVG</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="largest">Largest</TabsTrigger>
              <TabsTrigger value="unused">Unused</TabsTrigger>
            </TabsList>
          </Tabs>

          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between rounded-md border bg-accent/40 px-3 py-2">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline">
                      <FolderInput className="mr-1.5 h-3.5 w-3.5" /> Move to
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 overflow-y-auto">
                    <DropdownMenuItem onClick={() => void handleMove(null)}>Root</DropdownMenuItem>
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => void handleMove(f.id)}>
                        {f.path}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <PageLoader label="Loading media" />
          ) : assets.length === 0 ? (
            <EmptyState
              title="No media yet"
              description="Upload files using the panel on the left or drop them here."
            />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {assets.map((a) => {
                const isSel = selectedIds.has(a.id);
                return (
                  <div
                    key={a.id}
                    className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted transition ${
                      isSel ? "ring-2 ring-primary" : "hover:border-primary/50"
                    }`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || selectedIds.size > 0) {
                        toggleSelect(a.id);
                      } else {
                        setSelected(a);
                      }
                    }}
                  >
                    <MediaThumbnail asset={a} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                      <p className="truncate text-xs font-medium text-white">{a.file_name}</p>
                      <p className="text-[10px] text-white/70">{humanSize(a.size_bytes)}</p>
                    </div>
                    {a.usage_count > 0 && (
                      <Badge className="absolute right-1 top-1" variant="secondary">
                        ×{a.usage_count}
                      </Badge>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(a.id);
                      }}
                      className={`absolute left-1 top-1 h-5 w-5 rounded border-2 bg-background/80 ${
                        isSel ? "border-primary bg-primary" : "border-muted-foreground/50 opacity-0 group-hover:opacity-100"
                      }`}
                      aria-label="Select"
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="w-10 px-3 py-2"></th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Size</th>
                    <th className="px-3 py-2 text-left">Used</th>
                    <th className="px-3 py-2 text-left">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className="cursor-pointer border-t hover:bg-muted/40"
                    >
                      <td className="p-2">
                        <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                          <MediaThumbnail asset={a} />
                        </div>
                      </td>
                      <td className="px-3 py-2 font-medium">{a.file_name}</td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">{a.kind}</td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {humanSize(a.size_bytes)}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">{a.usage_count}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <MediaDetailsPanel asset={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
