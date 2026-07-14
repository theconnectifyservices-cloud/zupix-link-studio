import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Pencil,
  Check,
  GripVertical,
} from "lucide-react";
import { useBuilderStore } from "../store";
import { blockLabel, getBlockDef } from "../block-registry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/shared/ui/empty-state";

/** Layers list — reorder, hide, duplicate, rename, delete. */
export function LayersPanel() {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);
  const move = useBuilderStore((s) => s.moveBlock);
  const toggle = useBuilderStore((s) => s.toggleHidden);
  const dup = useBuilderStore((s) => s.duplicateBlock);
  const remove = useBuilderStore((s) => s.removeBlock);
  const rename = useBuilderStore((s) => s.renameBlock);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  if (blocks.length === 0) {
    return (
      <EmptyState
        title="No blocks yet"
        description="Add blocks from the Blocks tab to see them here."
      />
    );
  }

  return (
    <ul className="space-y-1">
      {blocks.map((b, i) => {
        const def = getBlockDef(b.type);
        const Icon = def?.icon;
        const active = selectedId === b.id;
        const isEditing = editingId === b.id;
        return (
          <li
            key={b.id}
            className={cn(
              "group flex items-center gap-1 rounded-md border bg-card p-1.5 transition-colors",
              active && "border-primary bg-primary/5",
            )}
          >
            <span
              className="cursor-grab p-1 text-muted-foreground opacity-0 group-hover:opacity-100"
              aria-hidden
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>
            <button
              type="button"
              onClick={() => select(b.id)}
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
                      rename(b.id, draft);
                      setEditingId(null);
                    }
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 text-xs"
                />
              ) : (
                <span className="truncate text-xs">{blockLabel(b)}</span>
              )}
            </button>
            <div className="flex items-center opacity-0 group-hover:opacity-100">
              <IconBtn label="Move up" onClick={() => move(b.id, -1)} disabled={i === 0}>
                <ChevronUp className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn
                label="Move down"
                onClick={() => move(b.id, 1)}
                disabled={i === blocks.length - 1}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn
                label={isEditing ? "Save name" : "Rename"}
                onClick={() => {
                  if (isEditing) {
                    rename(b.id, draft);
                    setEditingId(null);
                  } else {
                    setDraft(blockLabel(b));
                    setEditingId(b.id);
                  }
                }}
              >
                {isEditing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
              </IconBtn>
              <IconBtn label={b.hidden ? "Show" : "Hide"} onClick={() => toggle(b.id)}>
                {b.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </IconBtn>
              <IconBtn label="Duplicate" onClick={() => dup(b.id)}>
                <Copy className="h-3.5 w-3.5" />
              </IconBtn>
              <IconBtn label="Delete" onClick={() => remove(b.id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </IconBtn>
            </div>
          </li>
        );
      })}
    </ul>
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
