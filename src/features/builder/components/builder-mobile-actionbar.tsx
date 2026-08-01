import { useEffect, useState } from "react";
import {
  Eye,
  Loader2,
  MoreVertical,
  Redo2,
  Rocket,
  Save,
  Undo2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PublishSheet } from "@/features/publishing";
import type { BioContent } from "../types";

interface Props {
  pageId: string | null;
  content: BioContent;
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
  previewMode: boolean;
  onTogglePreview: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * Sticky mobile action bar.
 *
 * Always visible at the bottom of the builder (also in preview mode) so the
 * primary actions — Save, Preview, Publish — are never more than one tap away.
 * Undo/Redo stay inline on roomier phones and collapse into the More menu on
 * very narrow screens. Bottom padding respects the safe-area inset so the bar
 * is never covered by iOS/Android browser chrome.
 */
export function BuilderMobileActionBar({
  pageId,
  content,
  isDirty,
  saving,
  onSave,
  previewMode,
  onTogglePreview,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: Props) {
  const [publishOpen, setPublishOpen] = useState(false);

  // Narrow phones (<380px): undo/redo move into the More menu.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 379px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <>
      <div
        data-zx-mobile-actionbar=""
        className="sticky bottom-0 z-50 shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center gap-1.5 px-2 py-2">
          {!narrow && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label="Undo"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label="Redo"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-5 w-5" />
              </Button>
            </>
          )}

          <Button
            variant={previewMode ? "secondary" : "outline"}
            className="h-11 min-w-11 flex-1 gap-1.5 px-2"
            onClick={onTogglePreview}
            aria-pressed={previewMode}
            aria-label={previewMode ? "Exit preview" : "Preview page"}
          >
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-medium">Preview</span>
          </Button>

          <Button
            variant="outline"
            className="relative h-11 min-w-11 flex-1 gap-1.5 px-2"
            onClick={onSave}
            disabled={saving || !pageId}
            aria-label={isDirty ? "Save unsaved changes" : "Save"}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Save className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate text-xs font-medium">Save</span>
            {isDirty && !saving && <UnsavedDot />}
          </Button>

          <Button
            className="relative h-11 min-w-11 flex-1 gap-1.5 px-2"
            onClick={() => setPublishOpen(true)}
            disabled={!pageId}
            aria-label="Open publish options"
          >
            <Rocket className="h-4 w-4 shrink-0" />
            <span className="truncate text-xs font-medium">Publish</span>
            {isDirty && <UnsavedDot />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label="More actions"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52">
              <DropdownMenuLabel>More actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {narrow && (
                <>
                  <DropdownMenuItem onSelect={onUndo} disabled={!canUndo}>
                    <Undo2 className="mr-2 h-4 w-4" /> Undo
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onRedo} disabled={!canRedo}>
                    <Redo2 className="mr-2 h-4 w-4" /> Redo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onSelect={() => setPublishOpen(true)} disabled={!pageId}>
                <Rocket className="mr-2 h-4 w-4" /> Versions &amp; history
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onTogglePreview}>
                <Eye className="mr-2 h-4 w-4" />
                {previewMode ? "Exit preview" : "Preview page"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {pageId && (
        <PublishSheet
          pageId={pageId}
          content={content}
          open={publishOpen}
          onOpenChange={setPublishOpen}
        />
      )}
    </>
  );
}

function UnsavedDot() {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute right-1 top-1 h-2 w-2 rounded-full",
        "bg-amber-500 ring-2 ring-background",
      )}
    />
  );
}
