import { createFileRoute } from "@tanstack/react-router";
import { BuilderMobileActionBar } from "@/features/builder/components/builder-mobile-actionbar";
import type { BioContent } from "@/features/builder/types";

export const Route = createFileRoute("/zx-dev-actionbar")({ component: Page });

function Page() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex-1 overflow-auto p-4">scratch</div>
      <BuilderMobileActionBar
        pageId={null}
        content={{ blocks: [] } as unknown as BioContent}
        isDirty
        saving={false}
        onSave={() => {}}
        previewMode={false}
        onTogglePreview={() => {}}
        canUndo
        canRedo
        onUndo={() => {}}
        onRedo={() => {}}
      />
    </div>
  );
}
