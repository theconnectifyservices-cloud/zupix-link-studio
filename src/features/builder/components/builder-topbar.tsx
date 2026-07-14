import { useEffect } from "react";
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
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "../store";
import { saveBuilderContent } from "../api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Viewport = "mobile" | "tablet" | "desktop";

interface Props {
  onTogglePreview: () => void;
  previewMode: boolean;
  viewport?: Viewport;
  onViewportChange?: (v: Viewport) => void;
}

/** Builder top bar: title, status, undo/redo, preview, save. */
export function BuilderTopbar({ onTogglePreview, previewMode, viewport, onViewportChange }: Props) {
  const pageId = useBuilderStore((s) => s.pageId);
  const pageName = useBuilderStore((s) => s.pageName);
  const status = useBuilderStore((s) => s.saveStatus);
  const past = useBuilderStore((s) => s.history.past.length);
  const future = useBuilderStore((s) => s.history.future.length);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const content = useBuilderStore((s) => s.content);
  const markSaving = useBuilderStore((s) => s.markSaving);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const markError = useBuilderStore((s) => s.markError);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        void handleSave();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo]);

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
        <Button variant="ghost" size="icon" aria-label="Undo" onClick={undo} disabled={past === 0}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Redo" onClick={redo} disabled={future === 0}>
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant={previewMode ? "default" : "ghost"}
          size="sm"
          onClick={onTogglePreview}
          className="gap-1.5"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave} className="gap-1.5">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>
        <Button size="sm" disabled className="gap-1.5">
          <Rocket className="h-4 w-4" />
          <span className="hidden sm:inline">Publish</span>
        </Button>
      </div>
    </header>
  );
}

function SaveIndicator({ status }: { status: ReturnType<typeof useBuilderStore.getState>["saveStatus"] }) {
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
