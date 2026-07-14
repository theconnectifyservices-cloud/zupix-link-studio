import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Pencil,
  Check,
  GripVertical,
  Lock,
  Unlock,
  Search,
  X,
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

/** Layers list — search, multi-select, drag reorder, lock, hide, bulk actions. */
export function LayersPanel() {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const selectedIds = useBuilderStore((s) => s.selectedIds);
  const removeMany = useBuilderStore((s) => s.removeMany);
  const duplicateMany = useBuilderStore((s) => s.duplicateMany);
  const hideMany = useBuilderStore((s) => s.hideMany);
  const clearSelection = useBuilderStore((s) => s.clearSelection);

  const [query, setQuery] = useState("");

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blocks.map((b) => b.id);
    return blocks
      .filter((b) => {
        const label = blockLabel(b).toLowerCase();
        return label.includes(q) || b.type.includes(q);
      })
      .map((b) => b.id);
  }, [blocks, query]);

  const filteredSet = useMemo(() => new Set(filteredIds), [filteredIds]);

  if (blocks.length === 0) {
    return (
      <EmptyState
        title="No blocks yet"
        description="Add blocks from the Blocks tab to see them here."
      />
    );
  }

  const selectionCount = selectedIds.length;
  const allHidden =
    selectionCount > 0 &&
    blocks.filter((b) => selectedIds.includes(b.id)).every((b) => b.hidden);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search layers…"
          aria-label="Search layers"
          className="h-8 pl-7 pr-7 text-xs"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {selectionCount > 1 && (
        <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/40 p-1.5 text-xs">
          <span className="px-1 font-medium">{selectionCount} selected</span>
          <div className="ml-auto flex items-center gap-0.5">
            <BulkBtn label="Duplicate" onClick={() => duplicateMany(selectedIds)}>
              <Copy className="h-3.5 w-3.5" />
            </BulkBtn>
            <BulkBtn
              label={allHidden ? "Show" : "Hide"}
              onClick={() => hideMany(selectedIds, !allHidden)}
            >
              {allHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </BulkBtn>
            <BulkBtn label="Delete" onClick={() => removeMany(selectedIds)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </BulkBtn>
            <BulkBtn label="Clear selection" onClick={() => clearSelection()}>
              <X className="h-3.5 w-3.5" />
            </BulkBtn>
          </div>
        </div>
      )}

      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {blocks.map((b) => (
            <LayerItem key={b.id} block={b} dimmed={query.length > 0 && !filteredSet.has(b.id)} />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

function LayerItem({ block, dimmed }: { block: Block; dimmed: boolean }) {
  const selectedId = useBuilderStore((s) => s.selectedId);
  const selectedIds = useBuilderStore((s) => s.selectedIds);
  const select = useBuilderStore((s) => s.select);
  const toggleSelect = useBuilderStore((s) => s.toggleSelect);
  const selectRange = useBuilderStore((s) => s.selectRange);
  const toggle = useBuilderStore((s) => s.toggleHidden);
  const toggleLocked = useBuilderStore((s) => s.toggleLocked);
  const dup = useBuilderStore((s) => s.duplicateBlock);
  const remove = useBuilderStore((s) => s.removeBlock);
  const rename = useBuilderStore((s) => s.renameBlock);

  const [isEditing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const def = getBlockDef(block.type);
  const Icon = def?.icon;
  const primary = selectedId === block.id;
  const multi = selectedIds.includes(block.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } =
    useSortable({ id: block.id, disabled: block.locked });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-1 rounded-md border bg-card p-1.5 transition-colors",
        multi && !primary && "border-primary/60 bg-primary/5",
        primary && "border-primary bg-primary/5",
        isDragging && "opacity-50",
        isOver && "ring-2 ring-primary/40",
        dimmed && "opacity-40",
      )}
    >
      <button
        type="button"
        aria-label={block.locked ? "Locked" : "Drag to reorder"}
        disabled={block.locked}
        className={cn(
          "p-1 text-muted-foreground transition-opacity",
          block.locked
            ? "cursor-not-allowed opacity-60"
            : "cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing",
        )}
        {...(block.locked ? {} : attributes)}
        {...(block.locked ? {} : listeners)}
      >
        {block.locked ? <Lock className="h-3 w-3" /> : <GripVertical className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          if (e.shiftKey) selectRange(block.id);
          else if (e.metaKey || e.ctrlKey) toggleSelect(block.id);
          else select(block.id);
        }}
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
          <span className={cn("truncate text-xs", block.hidden && "line-through opacity-70")}>
            {blockLabel(block)}
          </span>
        )}
      </button>
      <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
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
        <IconBtn
          label={block.locked ? "Unlock" : "Lock"}
          onClick={() => toggleLocked(block.id)}
        >
          {block.locked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn label={block.hidden ? "Show" : "Hide"} onClick={() => toggle(block.id)}>
          {block.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </IconBtn>
        <IconBtn label="Duplicate" onClick={() => dup(block.id)}>
          <Copy className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn label="Delete" onClick={() => remove(block.id)} disabled={block.locked}>
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

function BulkBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
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
