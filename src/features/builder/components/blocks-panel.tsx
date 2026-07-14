import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { BLOCK_DEFS, type BlockDef } from "../block-registry";
import { useBuilderStore } from "../store";
import { paletteDragId } from "./dnd-context";
import { cn } from "@/lib/utils";

/** Add-blocks palette. Click to append, or drag onto the canvas. */
export function BlocksPanel() {
  const groups = [
    { key: "essentials", label: "Essentials" },
    { key: "media", label: "Media" },
    { key: "advanced", label: "Advanced" },
    { key: "commerce", label: "Commerce" },
  ] as const;

  return (
    <div className="space-y-6">
      {groups.map((g) => {
        const items = BLOCK_DEFS.filter((d) => d.group === g.key);
        if (items.length === 0) return null;
        return (
          <div key={g.key}>
            <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {g.label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {items.map((def) => (
                <PaletteTile key={def.type} def={def} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaletteTile({ def }: { def: BlockDef }) {
  const addBlock = useBuilderStore((s) => s.addBlock);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: paletteDragId(def.type),
    disabled: !def.available,
  });
  const style = { transform: CSS.Translate.toString(transform) };
  const Icon = def.icon;

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      disabled={!def.available}
      onClick={() => def.available && addBlock(def.create())}
      {...attributes}
      {...listeners}
      className={cn(
        "group flex touch-none flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left transition-all",
        def.available
          ? "cursor-grab hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm active:cursor-grabbing"
          : "cursor-not-allowed opacity-50",
        isDragging && "opacity-40",
      )}
    >
      <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{def.label}</div>
        <div className="truncate text-[11px] text-muted-foreground">{def.description}</div>
      </div>
    </button>
  );
}
