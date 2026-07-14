import { useState } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Pencil,
  Check,
  GripVertical,
} from "lucide-react";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilderStore } from "../store";
import { blockLabel, getBlockDef } from "../block-registry";
import type { Block } from "../types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/shared/ui/empty-state";

/** Layers list — drag reorder, rename, hide, duplicate, delete. */
export function LayersPanel() {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const items = blocks.map((b) => b.id);

  if (blocks.length === 0) {
    return (
      <EmptyState
        title="No blocks yet"
        description="Add blocks from the Blocks tab to see them here."
      />
    );
  }

  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <ul className="space-y-1">
        {blocks.map((b) => (
          <LayerItem key={b.id} block={b} />
        ))}
      </ul>
    </SortableContext>
  );
}

function LayerItem({ block }: { block: Block }) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const toggle = useBuilderStore((s) => s.toggleHidden);
  const dup = useBuilderStore((s) => s.duplicateBlock);
  const remove = useBuilderStore((s) => s.removeBlock);
  const rename = useBuilderStore((s) => s.renameBlock);

  const [isEditing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const def = getBlockDef(block.type);
  const Icon = def?.icon;
  const active = selectedId === block.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: block.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-1 rounded-md border bg-card p-1.5 transition-colors",
        active && "border-primary bg-primary/5",
        isDragging && "opacity-50",
        isOver && "ring-2 ring-primary/40",
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => select(block.id)}
        className="flex min-w-0 flex-1 items-center gap-2 px-1 text-left"
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
        {isEditing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                rename(block.id, draft);
                setEditing(false);
              }
              if (e.key === "Escape") setEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-6 text-xs"
          />
        ) : (
          <span className="truncate text-xs">{blockLabel(block)}</span>
        )}
      </button>
      <div className="flex items-center opacity-0 group-hover:opacity-100">
        <IconBtn
          label={isEditing ? "Save name" : "Rename"}
          onClick={() => {
            if (isEditing) {
              rename(block.id, draft);
              setEditing(false);
            } else {
              setDraft(blockLabel(block));
              setEditing(true);
            }
          }}
        >
          {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn label={block.hidden ? "Show" : "Hide"} onClick={() => toggle(block.id)}>
          {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn label="Duplicate" onClick={() => dup(block.id)}>
          <Copy className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn label="Delete" onClick={() => remove(block.id)}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </IconBtn>
      </div>
    </li>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="h-6 w-6"
    >
      {children}
    </Button>
  );
}
