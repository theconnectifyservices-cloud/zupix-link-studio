import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PropertyPanel } from "./property-panel";
import { usePropertySave } from "../use-property-save";

/** Right sidebar container. Sticky header with Save CTA. */
export function BuilderRightPanel() {
  const { canSave, save, saving, isDirty } = usePropertySave();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
        <div className="text-sm font-semibold">Properties</div>
        <Button
          size="sm"
          onClick={save}
          disabled={!canSave}
          aria-label="Save changes"
          className={cn(
            "h-8 gap-1.5 rounded-full px-3 text-xs font-medium shadow-sm transition",
            canSave &&
              "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : isDirty ? (
            "Save"
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Saved
            </>
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PropertyPanel />
      </div>
    </div>
  );
}
