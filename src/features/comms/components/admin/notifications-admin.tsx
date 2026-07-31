import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  adminListNotifications,
  deleteNotification,
  saveNotification,
  searchUsers,
  type NotificationInput,
} from "../../api";
import {
  AUDIENCES,
  AUDIENCE_LABEL,
  NOTIFICATION_TYPES,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  TYPE_LABEL,
  TYPE_STYLE,
  isLive,
  type CommNotification,
} from "../../types";
import { cn } from "@/lib/utils";

const emptyDraft: NotificationInput = {
  title: "",
  description: "",
  type: "information",
  priority: "normal",
  audience: "all",
  status: "draft",
  target_user_ids: [],
  starts_at: new Date().toISOString(),
};

const toLocalInput = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : "";

export function NotificationsAdmin() {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [draft, setDraft] = useState<NotificationInput | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comm", "admin", "notifications"],
    queryFn: adminListNotifications,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["comm", "admin", "notifications"] });
    qc.invalidateQueries({ queryKey: ["comm", "feed"] });
  };

  const save = useMutation({
    mutationFn: saveNotification,
    onSuccess: () => {
      invalidate();
      setDraft(null);
      toast.success("Notification saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      invalidate();
      toast.success("Notification deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (data ?? []).filter(
      (n) => !t || n.title.toLowerCase().includes(t) || n.description.toLowerCase().includes(t),
    );
  }, [data, term]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search notifications"
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" /> New notification
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No notifications yet. Create your first announcement to reach users in-app.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => (
            <li
              key={n.id}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      TYPE_STYLE[n.type].chip,
                    )}
                  >
                    {TYPE_LABEL[n.type]}
                  </span>
                  <Badge variant={isLive(n) ? "default" : "secondary"} className="text-[11px]">
                    {isLive(n) ? "Live" : n.status}
                  </Badge>
                  {n.priority === "important" && (
                    <Badge variant="destructive" className="text-[11px]">
                      Popup
                    </Badge>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {AUDIENCE_LABEL[n.audience]}
                    {n.audience === "selected" ? ` (${n.target_user_ids.length})` : ""}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm font-medium">{n.title}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">{n.description}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => setDraft(toDraft(n))}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${n.title}"? This cannot be undone.`)) remove.mutate(n.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <NotificationDialog
        draft={draft}
        onChange={setDraft}
        onClose={() => setDraft(null)}
        onSave={(d) => save.mutate(d)}
        saving={save.isPending}
      />
    </div>
  );
}

function toDraft(n: CommNotification): NotificationInput {
  return { ...n };
}

function NotificationDialog({
  draft,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  draft: NotificationInput | null;
  onChange: (d: NotificationInput) => void;
  onClose: () => void;
  onSave: (d: NotificationInput) => void;
  saving: boolean;
}) {
  const [userTerm, setUserTerm] = useState("");
  const { data: users } = useQuery({
    queryKey: ["comm", "admin", "users", userTerm],
    queryFn: () => searchUsers(userTerm),
    enabled: draft?.audience === "selected",
  });

  if (!draft) return null;
  const set = (patch: Partial<NotificationInput>) => onChange({ ...draft, ...patch });
  const selected = draft.target_user_ids ?? [];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{draft.id ? "Edit notification" : "New notification"}</DialogTitle>
          <DialogDescription>
            Delivered in-app to the selected audience. No emails or push are sent.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cn-title">Title</Label>
            <Input
              id="cn-title"
              value={draft.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="New templates are live"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cn-desc">Short description</Label>
            <Textarea
              id="cn-desc"
              rows={3}
              value={draft.description ?? ""}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Tell users what changed and why it matters."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <Select value={draft.type} onValueChange={(v) => set({ type: v as never })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={draft.priority} onValueChange={(v) => set({ priority: v as never })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target audience">
              <Select value={draft.audience} onValueChange={(v) => set({ audience: v as never })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map((a) => (
                    <SelectItem key={a} value={a}>
                      {AUDIENCE_LABEL[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={draft.status} onValueChange={(v) => set({ status: v as never })}>
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
            </Field>
          </div>

          {draft.audience === "selected" && (
            <div className="rounded-lg border p-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Selected users ({selected.length})
              </Label>
              <Input
                value={userTerm}
                onChange={(e) => setUserTerm(e.target.value)}
                placeholder="Search by name or email"
                className="mt-2"
              />
              <ul className="mt-2 max-h-44 space-y-1 overflow-y-auto">
                {(users ?? []).map((u) => {
                  const on = selected.includes(u.id);
                  return (
                    <li key={u.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">
                        {u.display_name || "Unnamed"}{" "}
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </span>
                      <Switch
                        checked={on}
                        onCheckedChange={(c) =>
                          set({
                            target_user_ids: c
                              ? [...selected, u.id]
                              : selected.filter((id) => id !== u.id),
                          })
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Banner image URL (optional)">
              <Input
                value={draft.banner_image_url ?? ""}
                onChange={(e) => set({ banner_image_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Button text (optional)">
              <Input
                value={draft.button_text ?? ""}
                onChange={(e) => set({ button_text: e.target.value })}
                placeholder="Explore now"
              />
            </Field>
            <Field label="Button URL (optional)">
              <Input
                value={draft.button_url ?? ""}
                onChange={(e) => set({ button_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <div />
            <Field label="Start date">
              <Input
                type="datetime-local"
                value={toLocalInput(draft.starts_at)}
                onChange={(e) =>
                  set({ starts_at: new Date(e.target.value || Date.now()).toISOString() })
                }
              />
            </Field>
            <Field label="End date (optional)">
              <Input
                type="datetime-local"
                value={toLocalInput(draft.ends_at)}
                onChange={(e) =>
                  set({ ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })
                }
              />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || !draft.title.trim()}
            onClick={() => onSave(draft)}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save notification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
