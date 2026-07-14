import { BLOCK_DEFS } from "../block-registry";
import { useBuilderStore } from "../store";
import { cn } from "@/lib/utils";

/** Add-blocks palette. Available blocks add; disabled tiles preview only. */
export function BlocksPanel() {
  const addBlock = useBuilderStore((s) => s.addBlock);

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
                <button
                  key={def.type}
                  type="button"
                  disabled={!def.available}
                  onClick={() => def.available && addBlock(def.create())}
                  className={cn(
                    "group flex flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left transition-all",
                    def.available
                      ? "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
                      : "cursor-not-allowed opacity-50",
                  )}
                >
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
                    <def.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{def.label}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {def.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
