import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  adminListAnnouncements,
  deleteAnnouncement,
  saveAnnouncement,
  setAnnouncementEnabled,
  type AnnouncementInput,
} from "../../api";

const emptyDraft: AnnouncementInput = {
  message: "",
  mode: "static",
  background_color: "#111827",
  text_color: "#FFFFFF",
  is_enabled: false,
  starts_at: new Date().toISOString(),
};

const toLocalInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

export function AnnouncementBarAdmin() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<AnnouncementInput | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comm", "admin", "announcements"],
    queryFn: adminListAnnouncements,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["comm", "admin", "announcements"] });
    qc.invalidateQueries({ queryKey: ["comm", "announcement-bar"] });
  };

  const save = useMutation({
    mutationFn: saveAnnouncement,
    onSuccess: () => {
      invalidate();
      setDraft(null);
      toast.success("Announcement saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggle = useMutation({
    mutationFn: ({ id, on }: { id: string; on: boolean }) => setAnnouncementEnabled(id, on),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      invalidate();
      toast.success("Announcement deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Only one announcement can be enabled at a time.
        </p>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" /> New announcement
        </Button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      ) : (data ?? []).length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No announcement bars yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((a) => (
            <li key={a.id} className="rounded-xl border bg-card p-4">
              <div
                className="mb-3 overflow-hidden rounded-lg px-4 py-2 text-center text-sm font-medium"
                style={{ backgroundColor: a.background_color, color: a.text_color }}
              >
                <span className={a.mode === "marquee" ? "inline-block" : ""}>{a.message}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={a.is_enabled ? "default" : "secondary"}>
                  {a.is_enabled ? "Enabled" : "Disabled"}
                </Badge>
                <span className="text-xs text-muted-foreground">{a.mode}</span>
                <Switch
                  checked={a.is_enabled}
                  onCheckedChange={(on) => toggle.mutate({ id: a.id, on })}
                  aria-label="Toggle announcement"
                />
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDraft({ ...a })}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => confirm("Delete this announcement?") && remove.mutate(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <Dialog open onOpenChange={(o) => !o && setDraft(null)}>
          <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{draft.id ? "Edit announcement" : "New announcement"}</DialogTitle>
              <DialogDescription>Shown as a strip at the top of the app.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="ab-msg">Message</Label>
                <Input
                  id="ab-msg"
                  value={draft.message}
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                  placeholder="Festive offer — 30% off annual plans"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Display mode</Label>
                  <Select
                    value={draft.mode}
                    onValueChange={(v) => setDraft({ ...draft, mode: v as never })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="static">Static text</SelectItem>
                      <SelectItem value="marquee">Marquee text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Enabled</Label>
                  <div className="flex h-10 items-center">
                    <Switch
                      checked={!!draft.is_enabled}
                      onCheckedChange={(c) => setDraft({ ...draft, is_enabled: c })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ab-bt">Button text</Label>
                  <Input
                    id="ab-bt"
                    value={draft.button_text ?? ""}
                    onChange={(e) => setDraft({ ...draft, button_text: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ab-bu">Button URL</Label>
                  <Input
                    id="ab-bu"
                    value={draft.button_url ?? ""}
                    onChange={(e) => setDraft({ ...draft, button_url: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ab-bg">Background colour</Label>
                  <Input
                    id="ab-bg"
                    type="color"
                    className="h-10 p-1"
                    value={draft.background_color ?? "#111827"}
                    onChange={(e) => setDraft({ ...draft, background_color: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ab-tc">Text colour</Label>
                  <Input
                    id="ab-tc"
                    type="color"
                    className="h-10 p-1"
                    value={draft.text_color ?? "#FFFFFF"}
                    onChange={(e) => setDraft({ ...draft, text_color: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ab-start">Start date</Label>
                  <Input
                    id="ab-start"
                    type="datetime-local"
                    value={toLocalInput(draft.starts_at)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        starts_at: new Date(e.target.value || Date.now()).toISOString(),
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ab-end">End date</Label>
                  <Input
                    id="ab-end"
                    type="datetime-local"
                    value={toLocalInput(draft.ends_at)}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button
                disabled={save.isPending || !draft.message.trim()}
                onClick={() => save.mutate(draft)}
              >
                {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save announcement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
