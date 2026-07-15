import { useMemo, useState } from "react";
import { Search, Grid3x3, List, FolderInput, Trash2, Download, Tag as TagIcon, Plus } from "lucide-react";
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
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useMediaAssets, useMediaFolders } from "../hooks";
import { useCollections, useTags } from "../organization-hooks";
import { moveAssets } from "../api";
import {
  bulkDeleteAssets,
  bulkDownloadAssets,
  bulkTagAssets,
  addAssetsToCollection,
} from "../organization-api";
import { humanSize, type MediaAsset, type MediaKind } from "../types";
import { UploadDropzone } from "./upload-dropzone";
import { FolderTree } from "./folder-tree";
import { MediaThumbnail } from "./media-thumbnail";
import { MediaDetailsPanel } from "./media-details-panel";
import { StorageDashboard } from "./storage-dashboard";
import { CollectionsManager } from "./collections-manager";
import { TagsManager } from "./tags-manager";
import { BrandKitManager } from "./brand-kit-manager";
import { DuplicateFinder } from "./duplicate-finder";
import { FavoritesRecentsPanel } from "./favorites-recents-panel";
import { AdvancedSearch } from "./advanced-search";

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
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const { data: folders = [] } = useMediaFolders(workspaceId);
  const { data: collections = [] } = useCollections(workspaceId);
  const { data: allTags = [] } = useTags(workspaceId);

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
      folderId,
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
  const selectedAssets = assets.filter((a) => selectedIds.has(a.id));

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

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} asset(s)? This cannot be undone.`)) return;
    try {
      await bulkDeleteAssets(selectedAssets);
      toast.success(`Deleted ${selectedIds.size}`);
      clearSelection();
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleBulkDownload = async () => {
    toast.info(`Preparing ${selectedIds.size} downloads…`);
    try {
      await bulkDownloadAssets(selectedAssets);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleBulkTag = async () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!tags.length) return;
    try {
      await bulkTagAssets(Array.from(selectedIds), tags);
      toast.success(`Tagged ${selectedIds.size} file(s)`);
      setTagInput("");
      setTagDialogOpen(false);
      clearSelection();
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleAddToCollection = async (collectionId: string) => {
    try {
      await addAssetsToCollection(collectionId, Array.from(selectedIds), userId);
      toast.success("Added to collection");
      clearSelection();
      qc.invalidateQueries({ queryKey: ["media"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <StorageDashboard workspaceId={workspaceId} />

      <Tabs defaultValue="library" className="w-full">
        <TabsList className="flex w-full flex-wrap">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="brand-kits">Brand Kits</TabsTrigger>
          <TabsTrigger value="favorites">Favorites &amp; Recents</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="mt-4">
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
                <div className="relative min-w-[200px] flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, alt text…"
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

              {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-accent/20 px-2 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Popular tags:</span>
                  {allTags.slice(0, 8).map((t) => (
                    <Badge
                      key={t.id}
                      variant={search === t.name ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setSearch(t.name)}
                    >
                      {t.name}
                      <span className="ml-1 opacity-60">{t.usage_count}</span>
                    </Badge>
                  ))}
                </div>
              )}

              {selectedIds.size > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-accent/40 px-3 py-2">
                  <span className="text-sm font-medium">{selectedIds.size} selected</span>
                  <div className="flex flex-wrap gap-2">
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add to collection
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="max-h-64 overflow-y-auto">
                        {collections.length === 0 ? (
                          <DropdownMenuItem disabled>No collections yet</DropdownMenuItem>
                        ) : (
                          collections.map((c) => (
                            <DropdownMenuItem
                              key={c.id}
                              onClick={() => void handleAddToCollection(c.id)}
                            >
                              {c.name}
                              <Badge variant="outline" className="ml-auto text-[10px] capitalize">
                                {c.kind}
                              </Badge>
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="outline" onClick={() => setTagDialogOpen(true)}>
                      <TagIcon className="mr-1.5 h-3.5 w-3.5" /> Tag
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handleBulkDownload()}>
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => void handleBulkDelete()}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
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
                        {a.is_favorite && (
                          <span className="absolute right-1 top-6 text-amber-400">★</span>
                        )}
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
                            isSel
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/50 opacity-0 group-hover:opacity-100"
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
                        <th className="px-3 py-2 text-left">v</th>
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
                          <td className="px-3 py-2 font-medium">
                            <span className="flex items-center gap-1">
                              {a.file_name}
                              {a.is_favorite && <span className="text-amber-400">★</span>}
                            </span>
                          </td>
                          <td className="px-3 py-2 capitalize text-muted-foreground">{a.kind}</td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {humanSize(a.size_bytes)}
                          </td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">{a.usage_count}</td>
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">v{a.current_version}</td>
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
        </TabsContent>

        <TabsContent value="collections" className="mt-4">
          <CollectionsManager workspaceId={workspaceId} userId={userId} />
        </TabsContent>
        <TabsContent value="tags" className="mt-4">
          <TagsManager workspaceId={workspaceId} userId={userId} />
        </TabsContent>
        <TabsContent value="brand-kits" className="mt-4">
          <BrandKitManager workspaceId={workspaceId} userId={userId} />
        </TabsContent>
        <TabsContent value="favorites" className="mt-4">
          <FavoritesRecentsPanel workspaceId={workspaceId} onOpen={setSelected} />
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <AdvancedSearch workspaceId={workspaceId} onOpen={setSelected} />
        </TabsContent>
        <TabsContent value="duplicates" className="mt-4">
          <DuplicateFinder workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      <MediaDetailsPanel asset={selected} userId={userId} onClose={() => setSelected(null)} />

      {/* Bulk tag dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add tags to {selectedIds.size} asset(s)</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Comma-separated tags, e.g. hero, brand"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0, 12).map((t) => (
                <Badge
                  key={t.id}
                  variant="outline"
                  className="cursor-pointer text-xs"
                  onClick={() =>
                    setTagInput((prev) => (prev ? `${prev}, ${t.name}` : t.name))
                  }
                >
                  + {t.name}
                </Badge>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleBulkTag()}>Apply tags</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Silence unused import when tree-shaken
void DropdownMenuSeparator;
