import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Sparkles } from "lucide-react";
import { useBuilderStore } from "../store";
import { BlockRenderer } from "../block-renderer";
import type { Block } from "../types";
import { cn } from "@/lib/utils";

/** Live phone-frame preview. Sortable canvas + drop target for palette items. */
export function BuilderPreview() {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const select = useBuilderStore((s) => s.select);
  const items = blocks.map((b) => b.id);

  const { setNodeRef, isOver } = useDroppable({ id: "canvas-empty" });

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-muted/30 p-4 md:p-8">
      <div className="mx-auto w-full max-w-[380px]">
        <div className="relative rounded-[36px] border-[10px] border-foreground/90 bg-background shadow-2xl">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
          <div
            className="max-h-[720px] min-h-[560px] overflow-y-auto rounded-[26px] bg-background"
            onClick={() => select(null)}
          >
            <div className="space-y-2 px-5 pb-10 pt-10">
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
  const showIndicator = isOver && active?.id !== block.id;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {showIndicator && (
        <div className="pointer-events-none absolute -top-1 left-0 right-0 h-0.5 rounded-full bg-primary" />
      )}
      <div
        onClick={(e) => {
          e.stopPropagation();
          select(block.id);
        }}
        className={cn(
          "group relative flex items-stretch gap-1 rounded-lg border-2 border-transparent transition-colors",
          "hover:border-primary/40",
          selectedId === block.id && "border-primary",
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
          <BlockRenderer block={block} />
        </div>
      </div>
    </div>
  );
}
