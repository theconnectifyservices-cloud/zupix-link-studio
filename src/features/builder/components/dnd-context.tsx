import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBuilderStore } from "../store";
import { getBlockDef, blockLabel } from "../block-registry";
import type { BlockType } from "../types";

const PALETTE_PREFIX = "palette:";

export function paletteDragId(type: BlockType) {
  return `${PALETTE_PREFIX}${type}`;
}
export function isPaletteId(id: string) {
  return id.startsWith(PALETTE_PREFIX);
}

/** Shared DnD provider for canvas + layers + palette. */
export function BuilderDndProvider({ children }: { children: ReactNode }) {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const insertBlock = useBuilderStore((s) => s.insertBlock);
  const reorderBlocks = useBuilderStore((s) => s.reorderBlocks);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const activeIdStr = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    const overIndex = blocks.findIndex((b) => b.id === overId);
    const targetIndex = overIndex === -1 ? blocks.length : overIndex;

    if (isPaletteId(activeIdStr)) {
      const type = activeIdStr.slice(PALETTE_PREFIX.length) as BlockType;
      const def = getBlockDef(type);
      if (!def || !def.available) return;
      insertBlock(def.create(), targetIndex);
      return;
    }

    const fromIndex = blocks.findIndex((b) => b.id === activeIdStr);
    if (fromIndex === -1 || fromIndex === targetIndex) return;
    reorderBlocks(fromIndex, targetIndex);
  };

  const activeBlock =
    activeId && !isPaletteId(activeId) ? blocks.find((b) => b.id === activeId) : null;
  const activePaletteDef =
    activeId && isPaletteId(activeId)
      ? getBlockDef(activeId.slice(PALETTE_PREFIX.length) as BlockType)
      : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
        {activeBlock ? (
          <div className="rounded-md border-2 border-primary bg-card px-3 py-2 text-xs font-medium shadow-lg">
            {blockLabel(activeBlock)}
          </div>
        ) : activePaletteDef ? (
          <div className="flex items-center gap-2 rounded-md border-2 border-primary bg-card px-3 py-2 text-xs font-medium shadow-lg">
            <activePaletteDef.icon className="h-4 w-4 text-primary" />
            {activePaletteDef.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
