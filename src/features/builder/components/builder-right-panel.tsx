import { SaveActionButton } from "./save-status";
import { PropertyPanel } from "./property-panel";
import { usePropertySave } from "../use-property-save";

/** Right sidebar container. Sticky header with Save CTA. */
export function BuilderRightPanel() {
  const { canSave, save, saving, isDirty } = usePropertySave();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background/95 px-3 py-2 backdrop-blur">
        <div className="text-sm font-semibold">Properties</div>
        <SaveActionButton saving={saving} isDirty={isDirty} canSave={canSave} onSave={save} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PropertyPanel />
      </div>
    </div>
  );
}
