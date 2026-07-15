import { useMemo, useState } from "react";
import { Search, Star, StarOff, Trash2, Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  useCreatePrompt,
  useDeletePrompt,
  usePrompts,
  useUpdatePrompt,
} from "../hooks";
import { PROMPT_CATEGORIES } from "../types";
import { bumpPromptUsage } from "../api";

interface Props {
  workspaceId: string;
  userId: string;
  onUsePrompt?: (body: string) => void;
}

export function PromptLibrary({ workspaceId, userId, onUsePrompt }: Props) {
  const { data: prompts = [] } = usePrompts(workspaceId);
  const create = useCreatePrompt();
  const update = useUpdatePrompt(workspaceId);
  const del = useDeletePrompt(workspaceId);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");

  const filtered = useMemo(() => {
    const term = q.toLowerCase();
    return prompts.filter((p) => {
      if (tab === "favorites" && !p.favorite) return false;
      if (tab === "recent" && !p.last_used_at) return false;
      if (tab !== "all" && tab !== "favorites" && tab !== "recent" && p.category !== tab)
        return false;
      if (!term) return true;
      return (
        p.title.toLowerCase().includes(term) ||
        p.body.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [prompts, q, tab]);

  async function save() {
    if (!title.trim() || !body.trim()) return;
    await create.mutateAsync({ workspaceId, userId, title: title.trim(), body: body.trim(), category });
    setTitle("");
    setBody("");
    setCategory("general");
    setOpen(false);
    toast.success("Prompt saved");
  }

  async function use(id: string, current: number, text: string) {
    await bumpPromptUsage(id, current);
    if (onUsePrompt) {
      onUsePrompt(text);
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Prompt copied");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search prompts"
            className="pl-8"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> New prompt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save prompt</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                rows={6}
                placeholder="Prompt body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!title.trim() || !body.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          {PROMPT_CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No prompts here yet.
          </p>
        )}
        {filtered.map((p) => (
          <div key={p.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-medium">{p.title}</h4>
                  <Badge variant="secondary" className="capitalize">
                    {p.category}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{p.body}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => update.mutate({ id: p.id, patch: { favorite: !p.favorite } })}
                  aria-label="Favorite"
                >
                  {p.favorite ? (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive"
                  onClick={() => del.mutate(p.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => use(p.id, p.use_count, p.body)}
              >
                <Copy className="mr-1 h-3 w-3" /> {onUsePrompt ? "Use" : "Copy"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
