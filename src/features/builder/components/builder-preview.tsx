import { useBuilderStore } from "../store";
import { BlockRenderer } from "../block-renderer";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

/** Live phone-frame preview. Blocks are clickable for selection. */
export function BuilderPreview() {
  const blocks = useBuilderStore((s) => s.content.blocks);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const select = useBuilderStore((s) => s.select);

  return (
    <div className="flex h-full items-start justify-center overflow-auto bg-muted/30 p-4 md:p-8">
      <div className="mx-auto w-full max-w-[380px]">
        {/* Phone frame */}
        <div className="relative rounded-[36px] border-[10px] border-foreground/90 bg-background shadow-2xl">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
          <div
            className="max-h-[720px] min-h-[560px] overflow-y-auto rounded-[26px] bg-background"
            onClick={() => select(null)}
          >
            <div className="space-y-3 px-5 pb-10 pt-10">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
                  <Sparkles className="h-8 w-8" />
                  <div className="text-sm font-medium text-foreground">
                    Start building
                  </div>
                  <p className="max-w-[220px] text-xs">
                    Add your first block from the left panel.
                  </p>
                </div>
              ) : (
                blocks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      select(b.id);
                    }}
                    className={cn(
                      "block w-full rounded-lg border-2 border-transparent text-left transition-colors",
                      "hover:border-primary/40",
                      selectedId === b.id && "border-primary",
                      b.hidden && "opacity-40",
                    )}
                  >
                    <div className="p-1">
                      <BlockRenderer block={b} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
