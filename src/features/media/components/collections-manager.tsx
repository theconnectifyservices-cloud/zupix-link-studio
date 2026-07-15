import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Star,
  MoreVertical,
  Copy,
  Trash2,
  Pencil,
  Wand2,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useCollections, useCollectionAssets } from "../organization-hooks";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  duplicateCollection,
  toggleCollectionFavorite,
} from "../organization-api";
import type { MediaCollection, CollectionKind } from "../types";
import { MediaThumbnail } from "./media-thumbnail";

interface Props {
  workspaceId: string;
  userId: string;
}

export function CollectionsManager({ workspaceId, userId }: Props) {
  const qc = useQueryClient();
  const { data: collections = [], isLoading } = useCollections(workspaceId);
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<CollectionKind>("manual");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<MediaCollection | null>(null);
  const [editing, setEditing] = useState<MediaCollection | null>(null);
  const [editName, setEditName] = useState("");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["media", "collections"] });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      await createCollection({ workspaceId, userId, name, kind, description });
      toast.success("Collection created");
      setOpenNew(false);
      setName("");
      setDescription("");
      setKind("manual");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleToggleFav = async (c: MediaCollection) => {
    await toggleCollectionFavorite(c.id, !c.is_favorite);
    invalidate();
  };

  const handleDuplicate = async (c: MediaCollection) => {
    try {
      await duplicateCollection(c.id, userId);
      toast.success("Duplicated");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (c: MediaCollection) => {
    if (!window.confirm(`Delete collection "${c.name}"?`)) return;
    await deleteCollection(c.id);
    toast.success("Deleted");
    invalidate();
    if (selected?.id === c.id) setSelected(null);
  };

  const handleRename = async () => {
    if (!editing) return;
    await updateCollection(editing.id, { name: editName.trim() });
    toast.success("Renamed");
    setEditing(null);
    invalidate();
  };

  if (isLoading) return <PageLoader label="Loading collections" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Collections</h3>
          <p className="text-sm text-muted-foreground">
            Group assets manually or with smart rules
          </p>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="h-8 w-8" />}
          title="No collections yet"
          description="Create your first collection to organize related assets."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`group flex items-start gap-3 rounded-lg border p-3 text-left transition hover:border-primary/50 ${
                selected?.id === c.id ? "border-primary bg-accent/30" : ""
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                {c.kind === "smart" ? <Wand2 className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.is_favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {c.kind}
                  </Badge>
                  {c.description && (
                    <span className="truncate text-xs text-muted-foreground">{c.description}</span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded p-1 opacity-0 hover:bg-muted group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => void handleToggleFav(c)}>
                    <Star className="mr-2 h-3.5 w-3.5" />
                    {c.is_favorite ? "Unfavorite" : "Favorite"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditing(c);
                      setEditName(c.name);
                    }}
                  >
                    <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleDuplicate(c)}>
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => void handleDelete(c)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </button>
          ))}
        </div>
      )}

      {selected && <CollectionPreview collection={selected} />}

      {/* New collection dialog */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New collection</DialogTitle>
            <DialogDescription>Group related assets together.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Spring campaign" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as CollectionKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual — you pick each asset</SelectItem>
                  <SelectItem value="smart">Smart — rule-based auto-fill</SelectItem>
                  <SelectItem value="dynamic">Dynamic — reserved for future automations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenNew(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename collection</DialogTitle>
          </DialogHeader>
          <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleRename()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectionPreview({ collection }: { collection: MediaCollection }) {
  const { data: assets = [], isLoading } = useCollectionAssets(collection);
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-medium">
          {collection.name}
          <span className="ml-2 text-sm text-muted-foreground">{assets.length} assets</span>
        </h4>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : assets.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {collection.kind === "manual"
            ? "No assets yet — add some from the library."
            : "No assets match this collection's rules yet."}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {assets.slice(0, 24).map((a) => (
            <div key={a.id} className="aspect-square overflow-hidden rounded border bg-muted">
              <MediaThumbnail asset={a} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
