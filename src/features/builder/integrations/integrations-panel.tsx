import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useBuilderStore } from "../store";
import { newId } from "../types";
import { INTEGRATIONS, integrationDefaults } from "./registry";
import { cn } from "@/lib/utils";

/**
 * Integration Center palette — one tile per registered provider.
 * Adding a provider to the registry automatically shows it here.
 */
export function IntegrationsPanel({ onAdded }: { onAdded?: () => void } = {}) {
  const [q, setQ] = useState("");
  const addBlock = useBuilderStore((s) => s.addBlock);

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return INTEGRATIONS;
    return INTEGRATIONS.filter(
      (i) => i.label.toLowerCase().includes(term) || i.description.toLowerCase().includes(term),
    );
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search integrations"
          className="h-9 pl-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((def) => {
          const Icon = def.icon;
          return (
            <button
              key={def.key}
              type="button"
              onClick={() => {
                addBlock({
                  id: newId(),
                  type: "integration",
                  provider: def.key,
                  mode: def.modes[0],
                  config: integrationDefaults(def),
                });
                onAdded?.();
              }}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-lg border bg-card p-3 text-left transition-all",
                "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm",
              )}
            >
              <span
                className="grid h-8 w-8 place-items-center rounded-md"
                style={{ backgroundColor: `${def.brand}1f`, color: def.brand }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{def.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {def.description}
                </span>
              </span>
            </button>
          );
        })}
        {items.length === 0 && (
          <div className="col-span-2 rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            No integrations match "{q}"
          </div>
        )}
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Integrations are saved as structured settings — no HTML required. Developers can still use
        the HTML block under Advanced.
      </p>
    </div>
  );
}
