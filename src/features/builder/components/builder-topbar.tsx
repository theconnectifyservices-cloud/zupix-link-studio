import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Eye,
  Save,
  Rocket,
  Loader2,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Smartphone,
  Tablet,
  Monitor,
  History,
  Plus,
  Trash2,
  RotateCcw,
  LayoutTemplate,
  BookmarkPlus,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "../store";
import { saveBuilderContent } from "../api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
import { EmptyState } from "@/shared/ui/empty-state";
import { TemplateGallery, SaveTemplateDialog } from "@/features/templates";
import { PublishDialog } from "@/features/publishing";
import { SeoDialog } from "@/features/seo";
import { ShareDialog } from "@/features/sharing";

type Viewport = "mobile" | "tablet" | "desktop";

interface Props {
  onTogglePreview: () => void;
  previewMode: boolean;
  viewport?: Viewport;
  onViewportChange?: (v: Viewport) => void;
}

/** Builder top bar: title, status, undo/redo, viewport, versions, preview, save. */
export function BuilderTopbar({ onTogglePreview, previewMode, viewport, onViewportChange }: Props) {
  const pageId = useBuilderStore((s) => s.pageId);
  const pageName = useBuilderStore((s) => s.pageName);
  const pageSlug = useBuilderStore((s) => s.pageSlug);
  const status = useBuilderStore((s) => s.saveStatus);
  const past = useBuilderStore((s) => s.history.past.length);
  const future = useBuilderStore((s) => s.history.future.length);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const content = useBuilderStore((s) => s.content);
  const markSaving = useBuilderStore((s) => s.markSaving);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const markError = useBuilderStore((s) => s.markError);

  // Cmd/Ctrl+S save (undo/redo handled by the global builder shortcuts hook)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    if (!pageId) return;
    markSaving();
    try {
      await saveBuilderContent(pageId, content);
      markSaved();
      toast.success("Saved");
    } catch {
      markError();
      toast.error("Save failed");
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
      <Button variant="ghost" size="icon" aria-label="Back to projects" asChild>
        <Link to="/app/projects">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-medium">{pageName || "Untitled"}</span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          Draft
        </span>
      </div>

      <div className="ml-3 hidden items-center gap-1 sm:flex">
        <SaveIndicator status={status} />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {onViewportChange && (
          <div className="mr-1 hidden items-center gap-0.5 rounded-md border p-0.5 md:flex">
            {(
              [
                ["mobile", Smartphone, "Mobile"],
                ["tablet", Tablet, "Tablet"],
                ["desktop", Monitor, "Desktop"],
              ] as const
            ).map(([v, Icon, label]) => (
              <Button
                key={v}
                variant={viewport === v ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                aria-label={label}
                onClick={() => onViewportChange(v)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo"
          title="Undo (⌘Z)"
          onClick={undo}
          disabled={past === 0}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Redo"
          title="Redo (⌘⇧Z)"
          onClick={redo}
          disabled={future === 0}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <TemplatesDialog />
        <SaveAsTemplateButton />
        {pageId && (
          <SeoDialog pageId={pageId} pageName={pageName} slug={pageSlug} />
        )}
        <VersionHistoryDialog />
        <Button
          variant={previewMode ? "default" : "ghost"}
          size="sm"
          onClick={onTogglePreview}
          className="gap-1.5"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          className="gap-1.5"
          title="Save (⌘S)"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        {pageId && <ShareDialog pageId={pageId} />}
        {pageId && <PublishDialog pageId={pageId} content={content} />}
      </div>
    </header>
  );
}

function VersionHistoryDialog() {
  const versions = useBuilderStore((s) => s.versions);
  const snapshot = useBuilderStore((s) => s.snapshotVersion);
  const restore = useBuilderStore((s) => s.restoreVersion);
  const del = useBuilderStore((s) => s.deleteVersion);
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Version history" title="Version history">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Version history</DialogTitle>
          <DialogDescription>
            Snapshot the current state so you can restore it later. Up to 20 versions per page.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Version label (optional)"
            className="h-8"
          />
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              snapshot(label);
              setLabel("");
              toast.success("Version saved");
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Save version
          </Button>
        </div>
        <div className="max-h-72 overflow-y-auto rounded-md border">
          {versions.length === 0 ? (
            <EmptyState title="No versions yet" description="Save a version to see it here." />
          ) : (
            <ul className="divide-y">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center gap-2 p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{v.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(v.at).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Restore version"
                    title="Restore"
                    onClick={() => {
                      restore(v.id);
                      toast.success(`Restored "${v.label}"`);
                      setOpen(false);
                    }}
                    className="h-7 w-7"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Delete version"
                    title="Delete"
                    onClick={() => del(v.id)}
                    className="h-7 w-7"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SaveIndicator({
  status,
}: {
  status: ReturnType<typeof useBuilderStore.getState>["saveStatus"];
}) {
  const items = {
    idle: { icon: CircleDot, label: "Ready", cls: "text-muted-foreground" },
    dirty: { icon: CircleDot, label: "Unsaved changes", cls: "text-amber-600" },
    saving: { icon: Loader2, label: "Saving…", cls: "text-muted-foreground animate-spin-slow" },
    saved: { icon: CheckCircle2, label: "Saved", cls: "text-emerald-600" },
    error: { icon: AlertCircle, label: "Save failed", cls: "text-destructive" },
  } as const;
  const it = items[status];
  return (
    <span className={cn("flex items-center gap-1.5 text-xs", it.cls)}>
      <it.icon className={cn("h-3.5 w-3.5", status === "saving" && "animate-spin")} />
      {it.label}
    </span>
  );
}

function TemplatesDialog() {
  const [open, setOpen] = useState(false);
  const applyTemplate = useBuilderStore((s) => s.applyTemplate);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" title="Templates">
          <LayoutTemplate className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[80vh] max-w-6xl flex-col gap-3 p-4">
        <DialogHeader className="text-left">
          <DialogTitle>Template Library</DialogTitle>
          <DialogDescription>
            Apply a professional design to this page in one click.
          </DialogDescription>
        </DialogHeader>
        <TemplateGallery
          mode="apply"
          onApply={(t, opts) => {
            applyTemplate(t.theme, { blocks: t.blocks, replaceContent: opts.replaceContent });
            toast.success(`Applied "${t.name}"`);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SaveAsTemplateButton() {
  const [open, setOpen] = useState(false);
  const content = useBuilderStore((s) => s.content);
  const theme = content.theme;
  if (!theme) return null;
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Save as template"
        title="Save as template"
        onClick={() => setOpen(true)}
      >
        <BookmarkPlus className="h-4 w-4" />
      </Button>
      <SaveTemplateDialog
        open={open}
        onOpenChange={setOpen}
        theme={theme}
        blocks={content.blocks}
      />
    </>
  );
}
