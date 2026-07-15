import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AI_TOOLS } from "../tools";

export function ToolsPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {AI_TOOLS.map((t) => {
        const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[t.icon] ?? Icons.Sparkles;
        return (
          <div
            key={t.id}
            className="rounded-lg border bg-card p-4 opacity-90 transition hover:opacity-100"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              {t.soon && <Badge variant="secondary">Coming soon</Badge>}
            </div>
            <h4 className="mt-3 font-semibold">{t.name}</h4>
            <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
          </div>
        );
      })}
    </div>
  );
}
