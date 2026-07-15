import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  MoreHorizontal,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  Search,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useConversations, useDeleteConversation, useUpdateConversation } from "../hooks";
import type { AiConversation } from "../types";

interface Props {
  workspaceId: string;
  activeId?: string;
  onCreate: () => void;
  className?: string;
}

export function ConversationList({ workspaceId, activeId, onCreate, className }: Props) {
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const { data: conversations = [], isLoading } = useConversations(workspaceId, showArchived);
  const update = useUpdateConversation(workspaceId);
  const del = useDeleteConversation(workspaceId);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return conversations.filter((c) => !term || c.title.toLowerCase().includes(term));
  }, [conversations, q]);

  function startRename(c: AiConversation) {
    setRenameId(c.id);
    setRenameValue(c.title);
  }
  async function commitRename() {
    if (renameId && renameValue.trim()) {
      await update.mutateAsync({ id: renameId, patch: { title: renameValue.trim() } });
    }
    setRenameId(null);
  }

  return (
    <div className={cn("flex h-full flex-col gap-3", className)}>
      <Button onClick={onCreate} className="w-full" size="sm">
        <Plus className="mr-1 h-4 w-4" /> New chat
      </Button>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search chats"
          className="pl-8"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{filtered.length} chats</span>
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="hover:text-foreground"
          type="button"
        >
          {showArchived ? "Hide archived" : "Show archived"}
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1">
        {isLoading && <p className="p-2 text-xs text-muted-foreground">Loading…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="p-2 text-xs text-muted-foreground">No conversations yet.</p>
        )}
        {filtered.map((c) => {
          const active = c.id === activeId;
          return (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-md text-sm",
                active ? "bg-muted" : "hover:bg-muted/50",
              )}
            >
              {renameId === c.id ? (
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenameId(null);
                  }}
                  className="h-8 flex-1"
                />
              ) : (
                <Link
                  to="/app/ai/$conversationId"
                  params={{ conversationId: c.id }}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2"
                >
                  {c.pinned && <Pin className="h-3 w-3 shrink-0 text-primary" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{c.title}</div>
                    {c.last_message_at && (
                      <div className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.last_message_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => startRename(c)}>
                    <Pencil className="mr-2 h-4 w-4" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => update.mutate({ id: c.id, patch: { pinned: !c.pinned } })}
                  >
                    {c.pinned ? (
                      <>
                        <PinOff className="mr-2 h-4 w-4" /> Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" /> Pin
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => update.mutate({ id: c.id, patch: { archived: !c.archived } })}
                  >
                    {c.archived ? (
                      <>
                        <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this conversation?")) del.mutate(c.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>
    </div>
  );
}
