import { Copy, Trash2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useClipboardManager } from "../clipboard.store";

/** Compact clipboard history dropdown for the topbar. Session-scoped. */
export function ClipboardHistory() {
  const history = useClipboardManager((s) => s.history);
  const clear = useClipboardManager((s) => s.clear);
  const remove = useClipboardManager((s) => s.remove);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Clipboard history" className="relative">
          <Copy className="h-4 w-4" />
          {history.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1 text-[9px] font-medium text-primary-foreground">
              {history.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <div className="text-sm font-semibold">Clipboard</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={clear}
            disabled={!history.length}
          >
            <Trash2 className="h-3 w-3" /> Clear
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {history.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Copy blocks, sections, or assets to see them here.
            </div>
          ) : (
            <ul className="divide-y">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center gap-2 p-3 text-sm">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {entry.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                  <button
                    onClick={() => remove(entry.id)}
                    aria-label="Remove entry"
                    className="rounded p-1 hover:bg-accent"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
