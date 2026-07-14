import { useState } from "react";
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
} from "lucide-react";
import { useBuilderStore } from "../store";
import { BlockRenderer } from "../block-renderer";
import type { Block } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Viewport = "mobile" | "tablet" | "desktop";

const FRAME: Record<Viewport, string> = {
  mobile: "max-w-[380px]",
  tablet: "max-w-[720px]",
  desktop: "max-w-[1024px]",
};

/** Live phone-frame preview. Sortable canvas + drop target for palette items. */
export function BuilderPreview({ viewport = "mobile" }: { viewport?: Viewport }) {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const select = useBuilderStore((s) => s.select);
  const items = blocks.map((b) => b.id);

  const { setNodeRef, isOver } = useDroppable({ id: "canvas-empty" });

  const isPhone = viewport === "mobile";

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-muted/30 p-4 md:p-8">
      <div className={cn("mx-auto w-full", FRAME[viewport])}>
        <div
          className={cn(
            "relative bg-background shadow-2xl",
            isPhone
              ? "rounded-[36px] border-[10px] border-foreground/90"
              : "rounded-2xl border",
          )}
        >
          {isPhone && (
            <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
          )}
          <div
            className={cn(
              "overflow-y-auto bg-background",
              isPhone
                ? "max-h-[720px] min-h-[560px] rounded-[26px]"
                : "max-h-[820px] min-h-[560px] rounded-xl",
            )}
            onClick={() => select(null)}
          >
            <div className={cn("space-y-2 pb-10 pt-10", isPhone ? "px-5" : "px-8")}>
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {blocks.length === 0 ? (
                  <div
                    ref={setNodeRef}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground transition-colors",
                      isOver ? "border-primary bg-primary/5" : "border-muted",
                    )}
                  >
                    <Sparkles className="h-8 w-8" />
                    <div className="text-sm font-medium text-foreground">Start building</div>
                    <p className="max-w-[220px] text-xs">
                      Drag a block here or tap one from the left panel.
                    </p>
                  </div>
                ) : (
                  blocks.map((b) => <SortableCanvasBlock key={b.id} block={b} />)
                )}
              </SortableContext>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableCanvasBlock({ block }: { block: Block }) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const toggleHidden = useBuilderStore((s) => s.toggleHidden);
  const dup = useBuilderStore((s) => s.duplicateBlock);
  const remove = useBuilderStore((s) => s.removeBlock);
  const move = useBuilderStore((s) => s.moveBlock);

  const [collapsed, setCollapsed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const active_ = selectedId === block.id;
  const showIndicator = isOver && active?.id !== block.id;

  function stop(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {showIndicator && (
        <div className="pointer-events-none absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-primary" />
      )}
      {active_ && (
        <div className="absolute -top-8 right-0 z-20 flex items-center gap-0.5 rounded-md border bg-background p-0.5 shadow-md">
          <ToolBtn label="Move up" onClick={stop(() => move(block.id, -1))}>
            <ArrowUp className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn label="Move down" onClick={stop(() => move(block.id, 1))}>
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
            label={block.hidden ? "Show" : "Hide"}
            onClick={stop(() => toggleHidden(block.id))}
          >
            {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </ToolBtn>
          <ToolBtn label="Duplicate" onClick={stop(() => dup(block.id))}>
            <Copy className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn label="Delete" onClick={stop(() => remove(block.id))}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </ToolBtn>
        </div>
      )}
      <div
        onClick={(e) => {
          e.stopPropagation();
          select(block.id);
        }}
        className={cn(
          "group relative flex items-stretch gap-1 rounded-lg border-2 border-transparent transition-colors",
          "hover:border-primary/40",
          active_ && "border-primary",
          block.hidden && "opacity-40",
          isDragging && "opacity-40",
        )}
      >
        <button
          type="button"
          aria-label="Drag to reorder"
          className="flex w-5 shrink-0 cursor-grab items-center justify-center rounded-l text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="min-w-0 flex-1 p-1">
          {collapsed ? (
            <div className="rounded-md bg-muted/50 px-2 py-1.5 text-[11px] text-muted-foreground">
              {block.name || block.type} · collapsed
            </div>
          ) : (
            <BlockRenderer block={block} />
          )}
        </div>
      </div>
    </div>
  );
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-6 w-6"
    >
      {children}
    </Button>
  );
}
