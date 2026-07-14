import { PropertyPanel } from "./property-panel";

/** Right sidebar container. */
export function BuilderRightPanel() {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="border-b p-3">
        <div className="text-sm font-semibold">Properties</div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <PropertyPanel />
      </div>
    </div>
  );
}
