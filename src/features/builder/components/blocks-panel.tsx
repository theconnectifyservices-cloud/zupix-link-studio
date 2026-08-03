import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Lock } from "lucide-react";
import { BLOCK_DEFS, type BlockDef } from "../block-registry";
import { useBuilderStore } from "../store";
import { paletteDragId } from "./dnd-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBlockAccess, usePlan } from "@/features/subscription/hooks";
import { PlanBadge } from "@/features/subscription/components/plan-badge";
import { requiredPlanForBlock } from "@/features/subscription/plans";

/** Add-blocks palette. Click to append, or drag onto the canvas. */
export function BlocksPanel({ onAdded }: { onAdded?: () => void } = {}) {
  const groups = [
    { key: "essentials", label: "Essentials" },
    { key: "social", label: "Social & Contact" },
    { key: "media", label: "Media" },
    { key: "advanced", label: "Advanced" },
    { key: "business", label: "Business Tools" },
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
                <PaletteTile key={def.type} def={def} onAdded={onAdded} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaletteTile({ def, onAdded }: { def: BlockDef; onAdded?: () => void }) {

  const addBlock = useBuilderStore((s) => s.addBlock);
  const blocks = useBuilderStore((s) => s.content.blocks);
  const { code: planCode } = usePlan();
  const access = useBlockAccess(def.type);
  const requiredPlan = requiredPlanForBlock(def.type);
  const isComingSoon = !def.available;
  const isLocked = def.available && !access.enabled;
  const draggable = def.available && access.enabled;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: paletteDragId(def.type),
    disabled: !draggable,
  });
  const style = { transform: CSS.Translate.toString(transform) };
  const Icon = def.icon;

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      onClick={() => {
        if (isComingSoon) return;
        if (isLocked) {
          access.requestUpgrade();
          return;
        }
        // UDAAN allows a single Contact Form per page.
        if (
          def.type === "form" &&
          planCode === "udaan" &&
          (blocks ?? []).some((b) => b.type === "form")
        ) {
          toast.error("UDAAN includes 1 contact form. Upgrade to TEJAS for unlimited forms.");
          access.requestUpgrade();
          return;
        }
        addBlock(def.create());
        onAdded?.();
      }}

      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
      className={cn(
        "group relative flex touch-none flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left transition-all",
        draggable && "cursor-grab hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm active:cursor-grabbing",
        isLocked && "cursor-pointer hover:border-primary/40 hover:shadow-sm",
        isComingSoon && "cursor-not-allowed opacity-50",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div
          className={cn(
            "grid h-8 w-8 place-items-center rounded-md",
            isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Icon className="h-4 w-4" />}
        </div>
        {requiredPlan && requiredPlan !== "udaan" && !isComingSoon && (
          <PlanBadge plan={requiredPlan} />
        )}
        {isComingSoon && <PlanBadge plan="shikhar" />}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{def.label}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {isComingSoon ? "Coming soon" : def.description}
        </div>
      </div>
    </button>
  );
}
