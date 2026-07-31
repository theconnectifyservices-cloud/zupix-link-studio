import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchReleaseNotes, saveReleaseNote, deleteReleaseNote, type ReleaseNoteInput } from "../../api";
import { STATUSES } from "../../types";

const emptyDraft: ReleaseNoteInput = {
  version: "",
  title: "",
  description: "",
  release_date: new Date().toISOString().slice(0, 10),
  status: "published",
};

export function ReleaseNotesAdmin() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<ReleaseNoteInput | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comm", "admin", "release-notes"],
    queryFn: () => fetchReleaseNotes(false),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["comm", "admin", "release-notes"] });
    qc.invalidateQueries({ queryKey: ["comm", "release-notes"] });
  };

  const save = useMutation({
    mutationFn: saveReleaseNote,
    onSuccess: () => {
      invalidate();
      setDraft(null);
      toast.success("Release note saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deleteReleaseNote,
    onSuccess: () => {
      invalidate();
      toast.success("Release note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Published notes appear on the user “What's New” page.
        </p>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" /> New release
        </Button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No release notes yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((r) => (
            <li key={r.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    v{r.version}
                  </span>
                  <Badge variant={r.status === "published" ? "default" : "secondary"}>
                    {r.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(r.release_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-medium">{r.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setDraft({ ...r })}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => confirm(`Delete v${r.version}?`) && remove.mutate(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit release note" : "New release note"}</DialogTitle>
              <DialogDescription>Versioned product updates for your users.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="rn-v">Version</Label>
                  <Input
                    id="rn-v"
                    value={draft.version}
                    onChange={(e) => setDraft({ ...draft, version: e.target.value })}
                    placeholder="1.4.0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rn-d">Release date</Label>
                  <Input
                    id="rn-d"
                    type="date"
                    value={draft.release_date ?? ""}
                    onChange={(e) => setDraft({ ...draft, release_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rn-t">Title</Label>
                <Input
                  id="rn-t"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Motion Studio & new templates"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rn-desc">Description</Label>
                <Textarea
                  id="rn-desc"
                  rows={6}
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder={"• Added …\n• Fixed …"}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(v) => setDraft({ ...draft, status: v as never })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s[0].toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button
                disabled={save.isPending || !draft.version.trim() || !draft.title.trim()}
                onClick={() => save.mutate(draft)}
              >
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save release note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
