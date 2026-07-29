import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Plus,
  Palette,
  Layers,
  Images,
  Settings2,
  Eye,
  Save,
  Undo2,
  Redo2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  SlidersHorizontal,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "../store";
import { saveBuilderContent } from "../api";
import { BuilderPreview } from "./builder-preview";
import { BlocksPanel } from "./blocks-panel";
import { ThemePanel } from "./theme-panel";
import { LayersPanel } from "./layers-panel";
import { PagesPanel } from "./pages-panel";
import { PropertyPanel } from "./property-panel";
import type { PreviewViewport } from "@/routes/_authenticated.builder.$id";

type PanelKey = "add" | "theme" | "layers" | "media" | "settings" | "properties" | null;

interface Props {
  previewMode: boolean;
  onTogglePreview: () => void;
  viewport: PreviewViewport;
}

/**
 * Touch-first mobile builder shell.
 *
 * - Full-screen canvas.
 * - Bottom toolbar (Canva style) with quick actions.
 * - Bottom-sheet panels instead of desktop sidebars.
 * - Floating Save FAB.
 * - Auto-opens the Properties sheet when a block is selected.
 */
export function BuilderMobileShell({ previewMode, onTogglePreview, viewport }: Props) {
  const pageId = useBuilderStore((s) => s.pageId);
  const pageName = useBuilderStore((s) => s.pageName);
  const status = useBuilderStore((s) => s.saveStatus);
  const past = useBuilderStore((s) => s.history.past.length);
  const future = useBuilderStore((s) => s.history.future.length);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const content = useBuilderStore((s) => s.content);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const markSaving = useBuilderStore((s) => s.markSaving);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const markError = useBuilderStore((s) => s.markError);

  const [panel, setPanel] = useState<PanelKey>(null);
  const [saving, setSaving] = useState(false);

  // Auto-open Properties sheet when a block is selected.
  useEffect(() => {
    if (selectedId && panel === null && !previewMode) setPanel("properties");
    if (!selectedId && panel === "properties") setPanel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, previewMode]);

  async function handleSave() {
    if (!pageId || saving) return;
    setSaving(true);
    markSaving();
    try {
      await saveBuilderContent(pageId, content);
      markSaved();
      toast.success("Saved");
    } catch {
      markError();
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-background">
      {/* Compact top bar */}
      <header className="flex h-12 shrink-0 items-center gap-1 border-b bg-background/95 px-2 backdrop-blur">
        <Button variant="ghost" size="icon" aria-label="Back" asChild className="h-9 w-9">
          <Link to="/app/projects">
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{pageName || "Untitled"}</div>
          <SaveIndicator status={status} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo"
          onClick={undo}
          disabled={past === 0}
          className="h-9 w-9"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Redo"
          onClick={redo}
          disabled={future === 0}
          className="h-9 w-9"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Button
          variant={previewMode ? "default" : "ghost"}
          size="icon"
          aria-label="Toggle preview"
          onClick={onTogglePreview}
          className="h-9 w-9"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </header>

      {/* Canvas — full-screen, edge-to-edge */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <BuilderPreview viewport={viewport} />

        {/* Floating Save FAB */}
        {!previewMode && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !pageId}
            aria-label="Save"
            className={cn(
              "absolute right-4 z-30 grid h-12 w-12 place-items-center rounded-full shadow-lg transition-all",
              "bg-primary text-primary-foreground active:scale-95 disabled:opacity-60",
            )}
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Bottom toolbar */}
      {!previewMode && (
        <nav
          className="grid shrink-0 grid-cols-6 border-t bg-background/95 backdrop-blur"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <ToolbarBtn icon={Plus} label="Add" onClick={() => setPanel("add")} />
          <ToolbarBtn icon={Palette} label="Theme" onClick={() => setPanel("theme")} />
          <ToolbarBtn icon={Layers} label="Layers" onClick={() => setPanel("layers")} />
          <ToolbarBtn icon={Images} label="Media" onClick={() => setPanel("media")} />
          <ToolbarBtn icon={Settings2} label="Pages" onClick={() => setPanel("settings")} />
          <ToolbarBtn
            icon={SlidersHorizontal}
            label="Edit"
            onClick={() => setPanel("properties")}
            highlight={!!selectedId}
          />
        </nav>
      )}

      <PanelSheet
        open={panel === "add"}
        onOpenChange={(o) => setPanel(o ? "add" : null)}
        title="Add block"
        description="Tap to insert or drag onto the canvas."
      >
        <BlocksPanel />
      </PanelSheet>

      <PanelSheet
        open={panel === "theme"}
        onOpenChange={(o) => setPanel(o ? "theme" : null)}
        title="Theme"
        description="Colors, fonts, backgrounds and motion."
      >
        <ThemePanel />
      </PanelSheet>

      <PanelSheet
        open={panel === "layers"}
        onOpenChange={(o) => setPanel(o ? "layers" : null)}
        title="Layers"
      >
        <LayersPanel />
      </PanelSheet>

      <PanelSheet
        open={panel === "media"}
        onOpenChange={(o) => setPanel(o ? "media" : null)}
        title="Media"
        description="Manage your workspace media library."
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload and organize images, videos and files in the Media Library, then reuse them
            in any block.
          </p>
          <Button asChild className="w-full">
            <Link to="/app/media" target="_blank">
              <Images className="mr-2 h-4 w-4" /> Open Media Library
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            Tip: use the image/video fields inside each block for quick uploads from camera,
            gallery or file picker.
          </p>
        </div>
      </PanelSheet>

      <PanelSheet
        open={panel === "settings"}
        onOpenChange={(o) => setPanel(o ? "settings" : null)}
        title="Pages"
        description="Manage this page and switch between pages."
      >
        <PagesPanel />
      </PanelSheet>

      <PanelSheet
        open={panel === "properties"}
        onOpenChange={(o) => setPanel(o ? "properties" : null)}
        title="Properties"
        description={selectedId ? "Edit the selected block." : "Select a block to edit."}
      >
        <PropertyPanel />
      </PanelSheet>
    </div>
  );
}

function ToolbarBtn({
  icon: Icon,
  label,
  onClick,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors active:bg-muted",
        highlight && "text-primary",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function PanelSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex h-[85dvh] flex-col gap-0 rounded-t-2xl border-t p-0"
      >
        {/* Drag handle */}
        <div className="flex shrink-0 justify-center pb-2 pt-3">
          <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        </div>
        <SheetHeader className="shrink-0 px-4 pb-3 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <SheetTitle className="text-base">{title}</SheetTitle>
              {description && (
                <SheetDescription className="text-xs">{description}</SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
        >
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SaveIndicator({ status }: { status: ReturnType<typeof useBuilderStore.getState>["saveStatus"] }) {
  const map = {
    idle: { icon: CircleDot, label: "Ready", cls: "text-muted-foreground" },
    dirty: { icon: CircleDot, label: "Unsaved", cls: "text-amber-600" },
    saving: { icon: Loader2, label: "Saving…", cls: "text-muted-foreground" },
    saved: { icon: CheckCircle2, label: "Saved", cls: "text-emerald-600" },
    error: { icon: AlertCircle, label: "Failed", cls: "text-destructive" },
  } as const;
  const it = map[status];
  return (
    <span className={cn("flex items-center gap-1 text-[10px]", it.cls)}>
      <it.icon className={cn("h-3 w-3", status === "saving" && "animate-spin")} />
      {it.label}
    </span>
  );
}

// Silence unused-imports for reserved future actions.
void Rocket;
