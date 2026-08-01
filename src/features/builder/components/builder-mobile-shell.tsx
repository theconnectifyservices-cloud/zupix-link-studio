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
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SaveActionButton, SaveStatusBadge, type SaveStatus } from "./save-status";
import { useBuilderStore } from "../store";
import { saveBuilderContent } from "../api";
import { usePropertySave } from "../use-property-save";
import { BuilderPreview } from "./builder-preview";
import { BuilderMobileActionBar } from "./builder-mobile-actionbar";
import { BlocksPanel } from "./blocks-panel";
import { IntegrationsPanel } from "../integrations/integrations-panel";

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
      {/* Compact top bar — always below the device status bar / notch */}
      <header className="sticky top-0 z-40 flex min-h-14 shrink-0 items-center gap-0.5 border-b bg-background/95 px-1.5 pt-[env(safe-area-inset-top,0px)] pl-[max(0.375rem,env(safe-area-inset-left))] pr-[max(0.375rem,env(safe-area-inset-right))] backdrop-blur">
        <Button variant="ghost" size="icon" aria-label="Back" asChild className="h-11 w-11 shrink-0">
          <Link to="/app/projects">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{pageName || "Untitled"}</div>
          <SaveIndicator status={status} />
        </div>
      </header>


      {/* Canvas — full-screen, edge-to-edge */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <BuilderPreview viewport={viewport} previewMode={previewMode} />
      </div>

      {/* Bottom toolbar */}
      {!previewMode && (
        <nav className="grid shrink-0 grid-cols-6 border-t bg-background/95 backdrop-blur">
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

      {/* Sticky primary actions — always visible, even in preview mode */}
      <BuilderMobileActionBar
        pageId={pageId}
        content={content}
        isDirty={status === "dirty" || status === "error"}
        saving={saving}
        onSave={handleSave}
        previewMode={previewMode}
        onTogglePreview={onTogglePreview}
        canUndo={past > 0}
        canRedo={future > 0}
        onUndo={undo}
        onRedo={redo}
      />

      <PanelSheet
        open={panel === "add"}
        onOpenChange={(o) => setPanel(o ? "add" : null)}
        title="Add block"
        description="Tap to insert or drag onto the canvas."
      >
        <BlocksPanel onAdded={() => setPanel("properties")} />
        <div className="mt-5 border-t pt-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Integrations
          </div>
          <IntegrationsPanel onAdded={() => setPanel("properties")} />
        </div>

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

      <PropertiesSheet
        open={panel === "properties"}
        onClose={() => setPanel(null)}
        selectedId={selectedId}
      />
    </div>
  );
}

function PropertiesSheet({
  open,
  onClose,
  selectedId,
}: {
  open: boolean;
  onClose: () => void;
  selectedId: string | null;
}) {
  const { canSave, save, saving, isDirty } = usePropertySave();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function requestClose() {
    if (isDirty) setConfirmOpen(true);
    else onClose();
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(o) => {
          if (o) return;
          requestClose();
        }}
      >
        <SheetContent
          side="bottom"
          className="flex h-[85dvh] flex-col gap-0 rounded-t-2xl border-t p-0"
        >
          <div className="flex shrink-0 justify-center pb-2 pt-3">
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetHeader className="sticky top-0 z-10 shrink-0 border-b bg-background/95 px-4 pb-3 text-left backdrop-blur">
            <div className="flex items-center justify-between gap-2 pr-8">
              <div className="min-w-0">
                <SheetTitle className="text-base">Properties</SheetTitle>
                <SheetDescription className="text-xs">
                  {selectedId ? "Edit the selected block." : "Select a block to edit."}
                </SheetDescription>
              </div>
              <SaveActionButton saving={saving} isDirty={isDirty} canSave={canSave} onSave={save} />
            </div>
          </SheetHeader>
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-4"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
          >
            <PropertyPanel />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved edits. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                onClose();
              }}
            >
              Discard
            </Button>
            <AlertDialogAction
              onClick={async () => {
                const ok = await save();
                setConfirmOpen(false);
                if (ok) onClose();
              }}
            >
              Save & close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

function SaveIndicator({ status }: { status: SaveStatus }) {
  return <SaveStatusBadge status={status} compact />;
}

// Silence unused-imports for reserved future actions.
void Rocket;
