import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Tag as TagIcon, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageLoader } from "@/shared/ui/page-loader";
import { useTags } from "../organization-hooks";
import { upsertTag, updateTag, deleteTag } from "../organization-api";
import { TAG_COLORS, tagColorClass, type MediaTag } from "../types";

interface Props {
  workspaceId: string;
  userId: string;
}

export function TagsManager({ workspaceId, userId }: Props) {
  const qc = useQueryClient();
  const { data: tags = [], isLoading } = useTags(workspaceId);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("slate");
  const [search, setSearch] = useState("");

  const filtered = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await upsertTag({ workspaceId, userId, name: newName, color: newColor });
      toast.success("Tag added");
      setNewName("");
      qc.invalidateQueries({ queryKey: ["media", "tags"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const setColor = async (tag: MediaTag, color: string) => {
    await updateTag(tag.id, { color });
    qc.invalidateQueries({ queryKey: ["media", "tags"] });
  };

  const remove = async (tag: MediaTag) => {
    if (!window.confirm(`Delete tag "${tag.name}"? It will be removed from all assets.`)) return;
    await deleteTag(workspaceId, tag.name);
    toast.success("Tag deleted");
    qc.invalidateQueries({ queryKey: ["media"] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Tags</h3>
        <p className="text-sm text-muted-foreground">
          Reusable labels for cross-collection organization
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Label>Create tag</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. hero, brand-2026"
            className="min-w-[200px] flex-1"
            onKeyDown={(e) => e.key === "Enter" && void create()}
          />
          <div className="flex gap-1 rounded-md border p-1">
            {TAG_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setNewColor(c.name)}
                className={`h-6 w-6 rounded-full ${c.cls} ${
                  newColor === c.name ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
                aria-label={c.name}
              />
            ))}
          </div>
          <Button onClick={() => void create()}>
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Badge variant="secondary">{tags.length} tags total</Badge>
      </div>

      {isLoading ? (
        <PageLoader label="Loading tags" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<TagIcon className="h-8 w-8" />} title="No tags found" />
      ) : (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3"
            >
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${tagColorClass(tag.color)}`} />
                <span className="font-medium">{tag.name}</span>
                {tag.is_auto && (
                  <Badge variant="outline" className="text-[10px]">
                    <Sparkles className="mr-1 h-2.5 w-2.5" /> auto
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  {tag.usage_count}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {TAG_COLORS.slice(0, 6).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => void setColor(tag, c.name)}
                      className={`h-4 w-4 rounded-full ${c.cls} ${
                        tag.color === c.name ? "ring-2 ring-primary" : ""
                      }`}
                      aria-label={c.name}
                    />
                  ))}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => void remove(tag)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
