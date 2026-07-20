import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Trash2, Archive, ArchiveRestore, Search } from "lucide-react";
import { toast } from "sonner";
import {
  listHtmlLibrary,
  duplicateHtmlLibraryEntry,
  archiveHtmlLibraryEntry,
  deleteHtmlLibraryEntry,
  type HtmlLibraryEntry,
} from "../api";
import { useWorkspaceStore } from "@/stores/workspace.store";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onInsert: (entry: HtmlLibraryEntry) => void;
}

export function HtmlLibraryDialog({ open, onOpenChange, onInsert }: Props) {
  const workspaceId = useWorkspaceStore((s) => s.current?.id);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const qc = useQueryClient();

  const listFn = useServerFn(listHtmlLibrary);
  const dupFn = useServerFn(duplicateHtmlLibraryEntry);
  const archFn = useServerFn(archiveHtmlLibraryEntry);
  const delFn = useServerFn(deleteHtmlLibraryEntry);

  const { data = [], isLoading } = useQuery({
    queryKey: ["html-library", workspaceId, showArchived],
    queryFn: () =>
      listFn({ data: { workspaceId: workspaceId!, includeArchived: showArchived } }),
    enabled: !!workspaceId && open,
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return data;
    return data.filter(
      (e) =>
        e.name.toLowerCase().includes(needle) ||
        (e.category ?? "").toLowerCase().includes(needle) ||
        (e.description ?? "").toLowerCase().includes(needle),
    );
  }, [data, q]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["html-library", workspaceId] });

  const duplicate = useMutation({
    mutationFn: (id: string) => dupFn({ data: { id, workspaceId: workspaceId! } }),
    onSuccess: () => {
      toast.success("Duplicated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const archive = useMutation({
    mutationFn: (v: { id: string; archive: boolean }) => archFn({ data: v }),
    onSuccess: () => invalidate(),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>HTML Library</DialogTitle>
          <DialogDescription>Reusable code snippets across your workspace.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search snippets…"
              className="pl-8"
            />
          </div>
          <Button
            size="sm"
            variant={showArchived ? "default" : "outline"}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>
        </div>
        <ScrollArea className="h-[420px] rounded-md border">
          {isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground">No snippets yet.</div>
          )}
          <ul className="divide-y">
            {filtered.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{e.name}</div>
                    <Badge variant="outline" className="text-[10px]">
                      {e.scope}
                    </Badge>
                    {e.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {e.category}
                      </Badge>
                    )}
                    {e.archived_at && (
                      <Badge variant="destructive" className="text-[10px]">
                        archived
                      </Badge>
                    )}
                  </div>
                  {e.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{e.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" onClick={() => onInsert(e)}>
                    Insert
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Duplicate"
                    onClick={() => duplicate.mutate(e.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={e.archived_at ? "Restore" : "Archive"}
                    onClick={() => archive.mutate({ id: e.id, archive: !e.archived_at })}
                  >
                    {e.archived_at ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete"
                    onClick={() => {
                      if (confirm(`Delete "${e.name}"? This cannot be undone.`)) del.mutate(e.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
