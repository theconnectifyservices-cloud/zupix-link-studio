import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Rocket,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Globe,
  Lock,
  EyeOff,
  KeyRound,
  History,
  RotateCcw,
  ArrowLeftRight,
  ShieldOff,
  CalendarClock,
  Share2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/shared/ui/empty-state";
import { cn } from "@/lib/utils";
import type { BioContent } from "@/features/builder/types";
import {
  archivePage,
  diffContent,
  fetchPublishState,
  fetchVersionContent,
  hashPassword,
  listPublishEvents,
  listVersions,
  publishPage,
  restoreVersion,
  schedulePage,
  snapshotVersion,
  unpublishPage,
  updateVisibility,
  type PublishState,
  type PublishVisibility,
} from "../api";
import { validateForPublish, type ValidationIssue } from "../validation";

interface Props {
  pageId: string;
  content: BioContent;
  onRestoredContent?: (content: BioContent) => void;
}

/** Publish button + full lifecycle dialog (validate, publish, versions, history, share). */
export function PublishDialog({ pageId, content, onRestoredContent }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Publish</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[85vh] max-w-3xl flex-col gap-3 p-0">
        <DialogHeader className="border-b px-5 pt-5">
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4" /> Publish
          </DialogTitle>
          <DialogDescription>
            Push your latest changes live, manage versions, or share the public link.
          </DialogDescription>
        </DialogHeader>
        <PublishDialogBody
          pageId={pageId}
          content={content}
          onRestoredContent={onRestoredContent}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function PublishDialogBody({
  pageId,
  content,
  onRestoredContent,
  onClose,
}: Props & { onClose: () => void }) {
  const qc = useQueryClient();
  const stateQ = useQuery({
    queryKey: ["publish-state", pageId],
    queryFn: () => fetchPublishState(pageId),
  });
  const state = stateQ.data;

  const validation = useMemo(() => validateForPublish(content), [content]);
  const canPublish = validation.ok;

  const publishMut = useMutation({
    mutationFn: async (note?: string) => {
      // Persist the current draft first so `content` and `published_content`
      // stay identical even if the last autosave hadn't landed yet.
      const { saveBuilderContent } = await import("@/features/builder/api");
      try {
        await saveBuilderContent(pageId, content);
      } catch {
        /* non-fatal — publishPage below also writes content */
      }
      return publishPage(pageId, { content, note });
    },
    onSuccess: (res) => {
      const liveUrl = `${window.location.origin}/${state?.slug ?? ""}`;
      toast.success("Published — live now", {
        description: `Updated ${new Date(res.publishedAt).toLocaleString()}`,
        action: {
          label: "Open live",
          onClick: () => window.open(liveUrl, "_blank", "noopener,noreferrer"),
        },
      });
      qc.invalidateQueries({ queryKey: ["publish-state", pageId] });
      qc.invalidateQueries({ queryKey: ["publish-versions", pageId] });
      qc.invalidateQueries({ queryKey: ["publish-events", pageId] });
      qc.invalidateQueries({ queryKey: ["bio-pages"] });
      // Bust the public renderer cache so the live URL shows the new version.
      if (state?.slug) {
        qc.removeQueries({ queryKey: ["public-bio", state.slug] });
        qc.invalidateQueries({ queryKey: ["public-bio", state.slug] });
      }
    },
    onError: (e: Error) => toast.error(e.message || "Publish failed"),
  });

  const unpublishMut = useMutation({
    mutationFn: () => unpublishPage(pageId),
    onSuccess: () => {
      toast.success("Page unpublished");
      qc.invalidateQueries({ queryKey: ["publish-state", pageId] });
      qc.invalidateQueries({ queryKey: ["publish-events", pageId] });
      qc.invalidateQueries({ queryKey: ["bio-pages"] });
    },
    onError: (e: Error) => toast.error(e.message || "Unpublish failed"),
  });

  if (stateQ.isLoading || !state) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="publish" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="mx-5 grid w-[calc(100%-2.5rem)] grid-cols-4">
        <TabsTrigger value="publish">Publish</TabsTrigger>
        <TabsTrigger value="visibility">Visibility</TabsTrigger>
        <TabsTrigger value="versions">Versions</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        <TabsContent value="publish" className="mt-3 space-y-4">
          <StatusCard state={state} />
          <ValidationList
            errors={validation.errors}
            warnings={validation.warnings}
          />
          <PublishActions
            state={state}
            canPublish={canPublish}
            publishing={publishMut.isPending}
            unpublishing={unpublishMut.isPending}
            onPublish={(note) => publishMut.mutate(note)}
            onUnpublish={() => unpublishMut.mutate()}
          />
          <ScheduleCard state={state} />
        </TabsContent>

        <TabsContent value="visibility" className="mt-3 space-y-4">
          <VisibilityCard state={state} />
          <ShareCard state={state} />
        </TabsContent>

        <TabsContent value="versions" className="mt-3">
          <VersionsPanel
            pageId={pageId}
            content={content}
            onRestored={(c) => {
              onRestoredContent?.(c);
              onClose();
            }}
          />
        </TabsContent>

        <TabsContent value="history" className="mt-3">
          <HistoryPanel pageId={pageId} />
        </TabsContent>
      </div>
    </Tabs>
  );
}

// ── Status ───────────────────────────────────────────────────────────────
const statusStyles: Record<PublishState["status"], { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-muted text-foreground" },
  published: {
    label: "Published",
    cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  scheduled: {
    label: "Scheduled",
    cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  archived: {
    label: "Archived",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  unpublished: {
    label: "Unpublished",
    cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  },
};

function StatusCard({ state }: { state: PublishState }) {
  const s = statusStyles[state.status];
  const liveUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${state.slug}`;
  const publishedAt = state.published_at ? new Date(state.published_at) : null;
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge className={cn("border-0", s.cls)}>{s.label}</Badge>
            <span className="text-sm font-medium">@{state.slug}</span>
          </div>
          {publishedAt ? (
            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
              <div>
                <span className="font-medium text-foreground">Last published:</span>{" "}
                {formatDistanceToNow(publishedAt, { addSuffix: true })}
              </div>
              <div className="text-[11px] opacity-80">{publishedAt.toLocaleString()}</div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">Not yet published</p>
          )}
        </div>
        {state.published_at && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.open(liveUrl, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open live
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Validation ───────────────────────────────────────────────────────────
function ValidationList({
  errors,
  warnings,
}: {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        Everything looks good. Ready to publish.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4" /> {errors.length} issue
            {errors.length === 1 ? "" : "s"} to fix
          </div>
          <ul className="space-y-1 text-xs text-destructive/90">
            {errors.map((e, i) => (
              <li key={i}>• {e.message}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
            <Info className="h-4 w-4" /> {warnings.length} suggestion
            {warnings.length === 1 ? "" : "s"}
          </div>
          <ul className="space-y-1 text-xs text-amber-800/90 dark:text-amber-300/90">
            {warnings.map((e, i) => (
              <li key={i}>• {e.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Publish actions ──────────────────────────────────────────────────────
function PublishActions({
  state,
  canPublish,
  publishing,
  unpublishing,
  onPublish,
  onUnpublish,
}: {
  state: PublishState;
  canPublish: boolean;
  publishing: boolean;
  unpublishing: boolean;
  onPublish: (note?: string) => void;
  onUnpublish: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="publish-note" className="text-xs">
          Release notes (optional)
        </Label>
        <Textarea
          id="publish-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed in this release?"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          className="gap-1.5"
          disabled={!canPublish || publishing}
          onClick={() => onPublish(note.trim() || undefined)}
        >
          {publishing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          {state.published_at ? "Publish update" : "Publish now"}
        </Button>
        {state.status === "published" && (
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={unpublishing}
            onClick={onUnpublish}
          >
            {unpublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldOff className="h-4 w-4" />
            )}
            Unpublish
          </Button>
        )}
        <ArchiveButton pageId={state.id} />
      </div>
    </div>
  );
}

function ArchiveButton({ pageId }: { pageId: string }) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: () => archivePage(pageId),
    onSuccess: () => {
      toast.success("Archived");
      qc.invalidateQueries({ queryKey: ["publish-state", pageId] });
      qc.invalidateQueries({ queryKey: ["bio-pages"] });
    },
    onError: (e: Error) => toast.error(e.message || "Archive failed"),
  });
  return (
    <Button
      variant="ghost"
      className="gap-1.5"
      disabled={m.isPending}
      onClick={() => m.mutate()}
    >
      Archive
    </Button>
  );
}

// ── Schedule ─────────────────────────────────────────────────────────────
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleCard({ state }: { state: PublishState }) {
  const qc = useQueryClient();
  const [publishAt, setPublishAt] = useState(toLocalInput(state.scheduled_publish_at));
  const [unpublishAt, setUnpublishAt] = useState(toLocalInput(state.scheduled_unpublish_at));
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const m = useMutation({
    mutationFn: () =>
      schedulePage(state.id, {
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
        unpublishAt: unpublishAt ? new Date(unpublishAt).toISOString() : null,
      }),
    onSuccess: () => {
      toast.success("Schedule updated");
      qc.invalidateQueries({ queryKey: ["publish-state", state.id] });
      qc.invalidateQueries({ queryKey: ["publish-events", state.id] });
    },
    onError: (e: Error) => toast.error(e.message || "Schedule failed"),
  });
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <CalendarClock className="h-4 w-4" /> Schedule
        <span className="ml-auto text-[11px] font-normal text-muted-foreground">{tz}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Set when this page should automatically publish or unpublish. Times use your local
        timezone.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Publish at</Label>
          <Input
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Unpublish at</Label>
          <Input
            type="datetime-local"
            value={unpublishAt}
            onChange={(e) => setUnpublishAt(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          disabled={m.isPending}
          onClick={() => m.mutate()}
          className="gap-1.5"
        >
          {m.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save schedule
        </Button>
      </div>
    </div>
  );
}

// ── Visibility ───────────────────────────────────────────────────────────
const visMeta: Record<PublishVisibility, { label: string; hint: string; icon: typeof Globe }> = {
  public: { label: "Public", hint: "Anyone with the link, indexed by search engines.", icon: Globe },
  unlisted: {
    label: "Unlisted",
    hint: "Anyone with the link, hidden from search engines.",
    icon: EyeOff,
  },
  password: {
    label: "Password protected",
    hint: "Visitors must enter a password (architecture only).",
    icon: KeyRound,
  },
  private: {
    label: "Private",
    hint: "Only workspace members can view. Not visible publicly.",
    icon: Lock,
  },
};

function VisibilityCard({ state }: { state: PublishState }) {
  const qc = useQueryClient();
  const [vis, setVis] = useState<PublishVisibility>(state.visibility);
  const [pwd, setPwd] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      const hash =
        vis === "password" && pwd.trim().length > 0
          ? await hashPassword(pwd.trim())
          : undefined;
      return updateVisibility(state.id, vis, hash);
    },
    onSuccess: () => {
      toast.success("Visibility updated");
      setPwd("");
      qc.invalidateQueries({ queryKey: ["publish-state", state.id] });
      qc.invalidateQueries({ queryKey: ["bio-pages"] });
    },
    onError: (e: Error) => toast.error(e.message || "Update failed"),
  });
  const meta = visMeta[vis];
  const Icon = meta.icon;
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" /> Visibility
      </div>
      <Select value={vis} onValueChange={(v) => setVis(v as PublishVisibility)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(visMeta) as PublishVisibility[]).map((k) => (
            <SelectItem key={k} value={k}>
              {visMeta[k].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{meta.hint}</p>
      {vis === "password" && (
        <div className="space-y-1.5">
          <Label className="text-xs">
            {state.has_password ? "Change password (leave blank to keep)" : "Set password"}
          </Label>
          <Input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            autoComplete="new-password"
          />
        </div>
      )}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => m.mutate()} disabled={m.isPending} className="gap-1.5">
          {m.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save visibility
        </Button>
      </div>
    </div>
  );
}

function ShareCard({ state }: { state: PublishState }) {
  const url =
    typeof window !== "undefined" ? `${window.location.origin}/${state.slug}` : `/${state.slug}`;
  const canShare = state.status === "published" && state.visibility !== "private";
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  }
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Share2 className="h-4 w-4" /> Share link
      </div>
      <div className="flex items-center gap-2">
        <Input readOnly value={url} className="font-mono text-xs" />
        <Button size="icon" variant="outline" onClick={copy} aria-label="Copy link">
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="Open live page"
          disabled={!canShare}
          onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      {!canShare && (
        <p className="text-xs text-muted-foreground">
          Publish this page and make it public or unlisted to share it.
        </p>
      )}
    </div>
  );
}

// ── Versions ─────────────────────────────────────────────────────────────
function VersionsPanel({
  pageId,
  content,
  onRestored,
}: {
  pageId: string;
  content: BioContent;
  onRestored: (c: BioContent) => void;
}) {
  const qc = useQueryClient();
  const versionsQ = useQuery({
    queryKey: ["publish-versions", pageId],
    queryFn: () => listVersions(pageId),
  });
  const [compareIds, setCompareIds] = useState<[string?, string?]>([undefined, undefined]);
  const [label, setLabel] = useState("");

  const snap = useMutation({
    mutationFn: () => snapshotVersion(pageId, content, label.trim() || undefined),
    onSuccess: () => {
      toast.success("Version saved");
      setLabel("");
      qc.invalidateQueries({ queryKey: ["publish-versions", pageId] });
    },
    onError: (e: Error) => toast.error(e.message || "Snapshot failed"),
  });
  const restore = useMutation({
    mutationFn: (id: string) => restoreVersion(pageId, id),
    onSuccess: (restored) => {
      toast.success("Version restored to draft");
      onRestored(restored);
      qc.invalidateQueries({ queryKey: ["publish-events", pageId] });
      qc.invalidateQueries({ queryKey: ["builder-page", pageId] });
    },
    onError: (e: Error) => toast.error(e.message || "Restore failed"),
  });

  function toggleCompare(id: string) {
    setCompareIds(([a, b]) => {
      if (a === id) return [b, undefined];
      if (b === id) return [a, undefined];
      if (!a) return [id, b];
      if (!b) return [a, id];
      return [b, id];
    });
  }

  const versions = versionsQ.data ?? [];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border p-3">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Version label (optional)"
          className="h-8"
        />
        <Button size="sm" onClick={() => snap.mutate()} disabled={snap.isPending}>
          {snap.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            "Save current as version"
          )}
        </Button>
      </div>

      {compareIds[0] && compareIds[1] && (
        <CompareView
          aId={compareIds[0]!}
          bId={compareIds[1]!}
          onClear={() => setCompareIds([undefined, undefined])}
        />
      )}

      <div className="rounded-lg border">
        {versionsQ.isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : versions.length === 0 ? (
          <EmptyState
            title="No versions yet"
            description="Every publish creates a version. You can also snapshot the draft."
          />
        ) : (
          <ul className="divide-y">
            {versions.map((v) => {
              const selected = compareIds.includes(v.id);
              return (
                <li key={v.id} className="flex items-center gap-2 p-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-medium">
                      {v.is_publish && (
                        <Badge className="border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          Published
                        </Badge>
                      )}
                      {v.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                      {v.notes ? ` — ${v.notes}` : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={selected ? "secondary" : "ghost"}
                    className="h-8 gap-1.5"
                    onClick={() => toggleCompare(v.id)}
                    title="Add to compare"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1.5"
                    onClick={() => restore.mutate(v.id)}
                    disabled={restore.isPending}
                    title="Restore into draft"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CompareView({
  aId,
  bId,
  onClear,
}: {
  aId: string;
  bId: string;
  onClear: () => void;
}) {
  const a = useQuery({ queryKey: ["version", aId], queryFn: () => fetchVersionContent(aId) });
  const b = useQuery({ queryKey: ["version", bId], queryFn: () => fetchVersionContent(bId) });
  if (a.isLoading || b.isLoading || !a.data || !b.data) {
    return (
      <div className="flex h-16 items-center justify-center rounded-lg border">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const diff = diffContent(a.data.content, b.data.content);
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
      <div className="mb-2 flex items-center justify-between text-sm font-medium">
        <span>
          Compare · {a.data.label} → {b.data.label}
        </span>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <li>
          <span className="text-emerald-700 dark:text-emerald-400">+{diff.addedIds.length}</span>{" "}
          added
        </li>
        <li>
          <span className="text-rose-700 dark:text-rose-400">−{diff.removedIds.length}</span>{" "}
          removed
        </li>
        <li>
          <span className="text-amber-700 dark:text-amber-400">~{diff.changedIds.length}</span>{" "}
          changed
        </li>
        <li>Theme: {diff.themeChanged ? "changed" : "unchanged"}</li>
      </ul>
    </div>
  );
}

// ── Publish history ──────────────────────────────────────────────────────
const actionLabels: Record<string, string> = {
  published: "Published",
  updated: "Updated",
  restored: "Restored",
  unpublished: "Unpublished",
  archived: "Archived",
  scheduled: "Scheduled",
  scheduled_cancelled: "Schedule cancelled",
};

function HistoryPanel({ pageId }: { pageId: string }) {
  const q = useQuery({
    queryKey: ["publish-events", pageId],
    queryFn: () => listPublishEvents(pageId),
  });
  if (q.isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  const events = q.data ?? [];
  if (events.length === 0)
    return <EmptyState title="No activity yet" description="Publish events will appear here." />;
  return (
    <div className="rounded-lg border">
      <ul className="divide-y">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 p-3 text-sm">
            <History className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{actionLabels[e.action] ?? e.action}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// keep effect import used elsewhere silent
useEffect;
