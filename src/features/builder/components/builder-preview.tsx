import { useEffect, useState } from "react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Sparkles,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ChevronsDownUp,
  Lock,
  Unlock,
  Scissors,
  ClipboardPaste,
} from "lucide-react";
import { useBuilderStore } from "../store";
import { BlockRenderer } from "../block-renderer";
import type { Block } from "../types";
import {
  DEFAULT_MOTION,
  DEFAULT_THEME,
  bgEffectClasses,
  pageTransitionClass,
  ensureGoogleFont,
  resolveMode,
  themeToCssVars,
} from "../theme";
import { collectFontFamilies } from "../fonts";
import { cn } from "@/lib/utils";
import { ThemeBackgroundLayer } from "./theme-background-layer";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ContactWidget } from "@/features/contact-widget";
import { RendererModeProvider } from "../renderer-mode";
import { EditorInteractionGuard } from "./editor-interaction-guard";


type Viewport = "mobile" | "tablet" | "desktop";

const FRAME: Record<Viewport, string> = {
  mobile: "max-w-[380px]",
  tablet: "max-w-[720px]",
  desktop: "max-w-[1024px]",
};

/** Live phone-frame preview. Sortable canvas + drop target for palette items. */
export function BuilderPreview({
  viewport = "mobile",
  previewMode = false,
}: {
  viewport?: Viewport;
  /** Live preview: real links, real embeds. Otherwise editor mode. */
  previewMode?: boolean;
}) {
  const blocks = useBuilderStore((s) => s.content.blocks ?? []);
  const theme = useBuilderStore((s) => s.content.theme) ?? DEFAULT_THEME;
  const contactWidget = useBuilderStore((s) => s.content.contactWidget);

  const clearSelection = useBuilderStore((s) => s.clearSelection);
  const items = blocks.map((b) => b.id);

  const { setNodeRef, isOver } = useDroppable({ id: "canvas-empty" });

  // Preload only the fonts referenced by per-element overrides.
  useEffect(() => {
    for (const f of collectFontFamilies(blocks)) ensureGoogleFont(f);
  }, [blocks]);

  const isPhone = viewport === "mobile";
  const resolvedMode = resolveMode(theme.mode);
  const themeStyle = themeToCssVars(theme, viewport);
  const motion = theme.motion ?? DEFAULT_MOTION;
  const bgCls = bgEffectClasses(theme).join(" ");
  const pageCls = pageTransitionClass(theme);

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-muted/30 p-4 md:p-8">
      <div className={cn("mx-auto w-full", FRAME[viewport])}>
        <div
          className={cn(
            "relative bg-background shadow-2xl",
            isPhone ? "rounded-[36px] border-[10px] border-foreground/90" : "rounded-2xl border",
          )}
        >
          {isPhone && (
            <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
          )}
          <div
            data-theme-mode={resolvedMode}
            className={cn(
              resolvedMode === "dark" && "dark",
              "overflow-y-auto overflow-x-hidden",
              `zx-vp-${viewport}`,
              bgCls,
              isPhone
                ? "max-h-[720px] min-h-[560px] rounded-[26px]"
                : "max-h-[820px] min-h-[560px] rounded-xl",
            )}
            style={themeStyle}
            onClick={() => !previewMode && clearSelection()}
          >
            <RendererModeProvider mode={previewMode ? "public" : "builder"}>
              <ThemeBackgroundLayer theme={theme} />
              <div
                className={cn("relative", pageCls)}
                style={{
                  paddingInline: "var(--zx-page-pad-x)",
                  paddingBlock: "var(--zx-page-pad-y)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--zx-block-gap)",
                  maxWidth: "var(--zx-content-max)",
                  marginInline: "auto",
                }}
              >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                  {blocks.length === 0 ? (
                    <div
                      ref={setNodeRef}
                      className={cn(
                        "rounded-lg border-2 border-dashed py-24 text-center text-sm text-muted-foreground transition-colors",
                        isOver && "border-primary bg-primary/5 text-primary",
                      )}
                    >
                      Drag a block here to get started.
                    </div>
                  ) : (
                    blocks.map((b, i) =>
                      previewMode ? (
                        <BlockRenderer
                          key={b.id}
                          block={b}
                          index={i}
                          viewport={viewport}
                          staggerStep={motion.stagger ? (motion.staggerStep ?? 60) : 0}
                          reduceMotion={!!motion.reduce}
                        />
                      ) : (
                        <SortableCanvasBlock
                          key={b.id}
                          block={b}
                          index={i}
                          viewport={viewport}
                          staggerStep={motion.stagger ? (motion.staggerStep ?? 60) : 0}
                          reduceMotion={!!motion.reduce}
                        />
                      ),
                    )
                  )}
                </SortableContext>
              </div>
              <EditorInteractionGuard active={!previewMode}>
                <ContactWidget config={contactWidget} embedded />
              </EditorInteractionGuard>
            </RendererModeProvider>
          </div>


        </div>
      </div>
    </div>
  );
}

function SortableCanvasBlock({
  block,
  index = 0,
  viewport = "mobile",
  staggerStep = 0,
  reduceMotion = false,
  previewMode = false,
}: {
  block: Block;
  index?: number;
  viewport?: Viewport;
  staggerStep?: number;
  reduceMotion?: boolean;
  previewMode?: boolean;
}) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const selectedIds = useBuilderStore((s) => s.selectedIds);
  const select = useBuilderStore((s) => s.select);
  const toggleSelect = useBuilderStore((s) => s.toggleSelect);
  const selectRange = useBuilderStore((s) => s.selectRange);
  const toggleHidden = useBuilderStore((s) => s.toggleHidden);
  const toggleLocked = useBuilderStore((s) => s.toggleLocked);
  const dup = useBuilderStore((s) => s.duplicateBlock);
  const remove = useBuilderStore((s) => s.removeBlock);
  const move = useBuilderStore((s) => s.moveBlock);
  const copySelection = useBuilderStore((s) => s.copySelection);
  const cutSelection = useBuilderStore((s) => s.cutSelection);
  const paste = useBuilderStore((s) => s.paste);
  const clipboardCount = useBuilderStore((s) => s.clipboard.length);

  const [collapsed, setCollapsed] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver, active } =
    useSortable({ id: block.id, disabled: block.locked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const primary = selectedId === block.id;
  const multi = selectedIds.includes(block.id);
  const showIndicator = isOver && active?.id !== block.id;

  function stop(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };
  }

  function ensureSelectedForMenu() {
    if (!selectedIds.includes(block.id)) select(block.id);
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div ref={setNodeRef} style={style} className="relative">
          {showIndicator && (
            <div className="pointer-events-none absolute -top-1 left-0 right-0 h-1 rounded-full bg-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]" />
          )}
          {primary && (
            <div className="absolute -top-8 right-0 z-20 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-md">
              <ToolBtn
                label="Move up"
                onClick={stop(() => move(block.id, -1))}
                disabled={block.locked}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn
                label="Move down"
                onClick={stop(() => move(block.id, 1))}
                disabled={block.locked}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn
                label={collapsed ? "Expand" : "Collapse"}
                onClick={stop(() => setCollapsed((v) => !v))}
              >
                {collapsed ? (
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronsDownUp className="h-3.5 w-3.5" />
                )}
              </ToolBtn>
              <ToolBtn
                label={block.locked ? "Unlock" : "Lock"}
                onClick={stop(() => toggleLocked(block.id))}
              >
                {block.locked ? (
                  <Unlock className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </ToolBtn>
              <ToolBtn
                label={block.hidden ? "Show" : "Hide"}
                onClick={stop(() => toggleHidden(block.id))}
              >
                {block.hidden ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </ToolBtn>
              <ToolBtn label="Duplicate" onClick={stop(() => dup(block.id))}>
                <Copy className="h-3.5 w-3.5" />
              </ToolBtn>
              <ToolBtn
                label="Delete"
                onClick={stop(() => remove(block.id))}
                disabled={block.locked}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </ToolBtn>
            </div>
          )}
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey) selectRange(block.id);
              else if (e.metaKey || e.ctrlKey) toggleSelect(block.id);
              else select(block.id);
            }}
            onContextMenu={ensureSelectedForMenu}
            className={cn(
              "group relative flex items-stretch gap-1 rounded-lg border-2 border-transparent transition-colors",
              "hover:border-primary/40",
              multi && !primary && "border-primary/60",
              primary && "border-primary",
              block.hidden && "opacity-40",
              isDragging && "opacity-40",
            )}
          >
            <button
              type="button"
              aria-label={block.locked ? "Locked block" : "Drag to reorder"}
              className={cn(
                "flex w-5 shrink-0 items-center justify-center rounded-l text-muted-foreground transition-opacity",
                block.locked
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing",
              )}
              {...(block.locked ? {} : attributes)}
              {...(block.locked ? {} : listeners)}
              onClick={(e) => e.stopPropagation()}
            >
              {block.locked ? (
                <Lock className="h-3 w-3" />
              ) : (
                <GripVertical className="h-3.5 w-3.5" />
              )}
            </button>
            <div className="min-w-0 flex-1 p-1">
              {collapsed ? (
                <div className="rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground">
                  {block.name || block.type} · collapsed
                </div>
              ) : (
                <EditorInteractionGuard
                  active={!previewMode}
                  onSelect={(e) => {
                    if (e.shiftKey) selectRange(block.id);
                    else if (e.metaKey || e.ctrlKey) toggleSelect(block.id);
                    else select(block.id);
                  }}
                >
                  <BlockRenderer
                    block={block}
                    index={index}
                    viewport={viewport}
                    staggerStep={staggerStep}
                    reduceMotion={reduceMotion}
                  />
                </EditorInteractionGuard>
              )}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={() => copySelection()}>
          <Copy className="mr-2 h-4 w-4" /> Copy
          <span className="ml-auto text-xs text-muted-foreground">⌘C</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => cutSelection()} disabled={block.locked}>
          <Scissors className="mr-2 h-4 w-4" /> Cut
          <span className="ml-auto text-xs text-muted-foreground">⌘X</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => paste()} disabled={clipboardCount === 0}>
          <ClipboardPaste className="mr-2 h-4 w-4" /> Paste
          <span className="ml-auto text-xs text-muted-foreground">⌘V</span>
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => dup(block.id)}>
          <Copy className="mr-2 h-4 w-4" /> Duplicate
          <span className="ml-auto text-xs text-muted-foreground">⌘D</span>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => move(block.id, -1)} disabled={block.locked}>
          <ArrowUp className="mr-2 h-4 w-4" /> Move up
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => move(block.id, 1)} disabled={block.locked}>
          <ArrowDown className="mr-2 h-4 w-4" /> Move down
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => toggleHidden(block.id)}>
          {block.hidden ? (
            <>
              <Eye className="mr-2 h-4 w-4" /> Show
            </>
          ) : (
            <>
              <EyeOff className="mr-2 h-4 w-4" /> Hide
            </>
          )}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => toggleLocked(block.id)}>
          {block.locked ? (
            <>
              <Unlock className="mr-2 h-4 w-4" /> Unlock
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" /> Lock
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={() => remove(block.id)}
          disabled={block.locked}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
          <span className="ml-auto text-xs text-muted-foreground">Del</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ToolBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="h-6 w-6"
    >
      {children}
    </Button>
  );
}
