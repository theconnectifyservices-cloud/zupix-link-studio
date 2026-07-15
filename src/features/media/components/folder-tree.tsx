import { useState } from "react";
import { Folder, FolderOpen, FolderPlus, Home, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { createFolder, deleteFolder, renameFolder } from "../api";
import type { MediaFolder } from "../types";

interface Props {
  workspaceId: string;
  userId: string;
  folders: MediaFolder[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface Node {
  folder: MediaFolder;
  children: Node[];
}

function buildTree(folders: MediaFolder[]): Node[] {
  const map = new Map<string, Node>();
  folders.forEach((f) => map.set(f.id, { folder: f, children: [] }));
  const roots: Node[] = [];
  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parent_id && map.has(f.parent_id)) map.get(f.parent_id)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}

export function FolderTree({ workspaceId, userId, folders, selectedId, onSelect }: Props) {
  const qc = useQueryClient();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [parentForNew, setParentForNew] = useState<MediaFolder | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["media"] });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createFolder({
        workspaceId,
        userId,
        name: newName,
        parentId: parentForNew?.id ?? null,
        parentPath: parentForNew?.path ?? "/",
      });
      toast.success("Folder created");
      setNewName("");
      setNewFolderOpen(false);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRename = async (f: MediaFolder) => {
    const name = window.prompt("Rename folder", f.name);
    if (!name || name === f.name) return;
    try {
      await renameFolder(f.id, name);
      toast.success("Renamed");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (f: MediaFolder) => {
    if (!window.confirm(`Delete folder "${f.name}"? Assets inside will be moved to root.`)) return;
    try {
      await deleteFolder(f.id);
      toast.success("Deleted");
      if (selectedId === f.id) onSelect(null);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const renderNode = (node: Node, depth: number) => {
    const isSelected = selectedId === node.folder.id;
    return (
      <div key={node.folder.id}>
        <div
          className={`group flex items-center gap-1 rounded px-2 py-1.5 text-sm ${
            isSelected ? "bg-accent" : "hover:bg-accent/50"
          }`}
          style={{ paddingLeft: 8 + depth * 12 }}
        >
          <button
            onClick={() => onSelect(node.folder.id)}
            className="flex min-w-0 flex-1 items-center gap-2"
          >
            {isSelected ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate">{node.folder.name}</span>
          </button>
          <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => {
                setParentForNew(node.folder);
                setNewFolderOpen(true);
              }}
              title="New subfolder"
            >
              <FolderPlus className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleRename(node.folder)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => handleDelete(node.folder)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {node.children.map((c) => renderNode(c, depth + 1))}
      </div>
    );
  };

  const tree = buildTree(folders);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Folders
        </h3>
        <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setParentForNew(null)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                New folder {parentForNew ? `in "${parentForNew.name}"` : ""}
              </DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Folder name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreate()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <button
        onClick={() => onSelect(null)}
        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm ${
          selectedId === null ? "bg-accent" : "hover:bg-accent/50"
        }`}
      >
        <Home className="h-4 w-4 text-muted-foreground" />
        All files
      </button>
      {tree.map((n) => renderNode(n, 0))}
    </div>
  );
}
