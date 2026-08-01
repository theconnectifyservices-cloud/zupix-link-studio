import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { VersionDraft } from "../../api";
import {
  PRIORITY_LABEL,
  RELEASE_TYPES,
  RELEASE_TYPE_LABEL,
  TARGETABLE_PLANS,
  UPDATE_PRIORITIES,
  UPDATE_VISIBILITIES,
  VISIBILITY_LABEL,
  isVersionValid,
  type PlatformVersion,
  type ReleaseType,
  type UpdatePriority,
  type UpdateVisibility,
} from "../../types";

type Form = {
  version: string;
  title: string;
  description: string;
  whats_new: string;
  bug_fixes: string;
  performance_improvements: string;
  security_updates: string;
  release_date: string;
  release_type: ReleaseType;
  priority: UpdatePriority;
  visibility: UpdateVisibility;
  target_plans: string[];
  target_user_ids: string;
  banner_image_url: string;
  video_url: string;
  docs_url: string;
  is_forced: boolean;
  is_important: boolean;
  is_pinned: boolean;
  publish_at: string;
};

const EMPTY: Form = {
  version: "",
  title: "",
  description: "",
  whats_new: "",
  bug_fixes: "",
  performance_improvements: "",
  security_updates: "",
  release_date: new Date().toISOString().slice(0, 10),
  release_type: "feature_update",
  priority: "normal",
  visibility: "everyone",
  target_plans: [],
  target_user_ids: "",
  banner_image_url: "",
  video_url: "",
  docs_url: "",
  is_forced: false,
  is_important: false,
  is_pinned: false,
  publish_at: "",
};

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

const toText = (arr?: string[] | null) => (arr ?? []).join("\n");

function fromRow(row: PlatformVersion): Form {
  return {
    version: row.version,
    title: row.title,
    description: row.description ?? "",
    whats_new: toText(row.whats_new),
    bug_fixes: toText(row.bug_fixes),
    performance_improvements: toText(row.performance_improvements),
    security_updates: toText(row.security_updates),
    release_date: row.release_date,
    release_type: row.release_type,
    priority: row.priority,
    visibility: row.visibility,
    target_plans: row.target_plans ?? [],
    target_user_ids: (row.target_user_ids ?? []).join("\n"),
    banner_image_url: row.banner_image_url ?? "",
    video_url: row.video_url ?? "",
    docs_url: row.docs_url ?? "",
    is_forced: row.is_forced,
    is_important: row.is_important,
    is_pinned: row.is_pinned,
    publish_at: row.publish_at ? row.publish_at.slice(0, 16) : "",
  };
}

export interface VersionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: PlatformVersion | null;
  onSave: (draft: VersionDraft) => void;
  saving?: boolean;
}

/** Create or edit a platform version, then save as draft, schedule or publish. */
export function VersionEditor({ open, onOpenChange, editing, onSave, saving }: VersionEditorProps) {
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromRow(editing) : EMPTY);
  }, [open, editing]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function build(status: PlatformVersion["status"]): VersionDraft | null {
    if (!isVersionValid(form.version)) {
      toast.error("Enter a valid version number, e.g. 2.1.0");
      return null;
    }
    if (!form.title.trim()) {
      toast.error("Give this release a title");
      return null;
    }
    if (status === "scheduled" && !form.publish_at) {
      toast.error("Pick a date and time to schedule this release");
      return null;
    }
    if (form.visibility === "plan" && form.target_plans.length === 0) {
      toast.error("Select at least one plan to target");
      return null;
    }
    const userIds = lines(form.target_user_ids);
    if (form.visibility === "users" && userIds.length === 0) {
      toast.error("Add at least one user ID to target");
      return null;
    }

    return {
      ...(editing ? { id: editing.id } : {}),
      version: form.version.trim(),
      title: form.title.trim(),
      description: form.description.trim(),
      whats_new: lines(form.whats_new),
      bug_fixes: lines(form.bug_fixes),
      performance_improvements: lines(form.performance_improvements),
      security_updates: lines(form.security_updates),
      release_date: form.release_date,
      release_type: form.release_type,
      priority: form.priority,
      visibility: form.visibility,
      target_plans: form.visibility === "plan" ? form.target_plans : [],
      target_user_ids: form.visibility === "users" ? userIds : [],
      banner_image_url: form.banner_image_url.trim() || null,
      video_url: form.video_url.trim() || null,
      docs_url: form.docs_url.trim() || null,
      is_forced: form.is_forced,
      is_important: form.is_important,
      is_pinned: form.is_pinned,
      status,
      publish_at: status === "scheduled" ? new Date(form.publish_at).toISOString() : null,
    } as VersionDraft;
  }

  function submit(status: PlatformVersion["status"]) {
    const draft = build(status);
    if (draft) onSave(draft);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="px-6 pb-3 pt-5">
          <DialogTitle>{editing ? `Edit v${editing.version}` : "New Version"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[62dvh]">
          <div className="space-y-5 px-6 pb-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Version number" hint="e.g. 2.1.0">
                <Input
                  value={form.version}
                  onChange={(e) => set("version", e.target.value)}
                  placeholder="2.1.0"
                />
              </Field>
              <Field label="Release date">
                <Input
                  type="date"
                  value={form.release_date}
                  onChange={(e) => set("release_date", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Update title">
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Motion Studio, faster publishing and more"
              />
            </Field>

            <Field label="Description">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="A short summary shown at the top of the update modal."
              />
            </Field>

            <Separator />

            <BulletField
              label="What's New"
              value={form.whats_new}
              onChange={(v) => set("whats_new", v)}
            />
            <BulletField
              label="Bug Fixes"
              value={form.bug_fixes}
              onChange={(v) => set("bug_fixes", v)}
            />
            <BulletField
              label="Performance Improvements"
              value={form.performance_improvements}
              onChange={(v) => set("performance_improvements", v)}
            />
            <BulletField
              label="Security Updates"
              value={form.security_updates}
              onChange={(v) => set("security_updates", v)}
            />

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Release type">
                <Select
                  value={form.release_type}
                  onValueChange={(v) => set("release_type", v as ReleaseType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELEASE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {RELEASE_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Priority">
                <Select
                  value={form.priority}
                  onValueChange={(v) => set("priority", v as UpdatePriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UPDATE_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Who should see this update?">
              <Select
                value={form.visibility}
                onValueChange={(v) => set("visibility", v as UpdateVisibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UPDATE_VISIBILITIES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {VISIBILITY_LABEL[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {form.visibility === "plan" && (
              <div className="flex flex-wrap gap-3 rounded-lg border p-3">
                {TARGETABLE_PLANS.map((plan) => {
                  const checked = form.target_plans.includes(plan);
                  return (
                    <label key={plan} className="flex items-center gap-2 text-sm capitalize">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) =>
                          set(
                            "target_plans",
                            c
                              ? [...form.target_plans, plan]
                              : form.target_plans.filter((p) => p !== plan),
                          )
                        }
                      />
                      {plan}
                    </label>
                  );
                })}
              </div>
            )}

            {form.visibility === "users" && (
              <Field label="Target user IDs" hint="One ID per line">
                <Textarea
                  rows={3}
                  value={form.target_user_ids}
                  onChange={(e) => set("target_user_ids", e.target.value)}
                  placeholder="00000000-0000-0000-0000-000000000000"
                />
              </Field>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Banner image URL">
                <Input
                  value={form.banner_image_url}
                  onChange={(e) => set("banner_image_url", e.target.value)}
                  placeholder="https://…"
                />
              </Field>
              <Field label="Video embed URL">
                <Input
                  value={form.video_url}
                  onChange={(e) => set("video_url", e.target.value)}
                  placeholder="https://www.youtube.com/embed/…"
                />
              </Field>
            </div>

            <Field label="Documentation link">
              <Input
                value={form.docs_url}
                onChange={(e) => set("docs_url", e.target.value)}
                placeholder="https://docs.zupix.in/releases/2-1-0"
              />
            </Field>

            <Separator />

            <div className="space-y-3 rounded-lg border p-4">
              <Toggle
                label="Force update"
                hint="Users cannot dismiss the modal until they update."
                checked={form.is_forced}
                onChange={(v) => set("is_forced", v)}
              />
              <Toggle
                label="Mark as important"
                hint="Highlights this release across the changelog."
                checked={form.is_important}
                onChange={(v) => set("is_important", v)}
              />
              <Toggle
                label="Pin to top"
                hint="Keeps this release above all others in the changelog."
                checked={form.is_pinned}
                onChange={(v) => set("is_pinned", v)}
              />
            </div>

            <Field label="Schedule release" hint="Only used when you choose Schedule below.">
              <Input
                type="datetime-local"
                value={form.publish_at}
                onChange={(e) => set("publish_at", e.target.value)}
              />
            </Field>
          </div>
        </ScrollArea>

        <footer className="flex flex-col gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => submit("draft")} disabled={saving}>
            Save as draft
          </Button>
          <Button variant="outline" onClick={() => submit("scheduled")} disabled={saving}>
            Schedule
          </Button>
          <Button onClick={() => submit("published")} disabled={saving}>
            Publish now
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BulletField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label} hint="One item per line">
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
