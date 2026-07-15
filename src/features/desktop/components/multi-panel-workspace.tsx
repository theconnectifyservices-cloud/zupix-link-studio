import { useCallback, type ReactNode } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useWorkspaceLayout } from "../workspace-layout.store";

interface Props {
  id: string;
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  defaultSizes?: [number, number, number];
}

/**
 * Three-pane resizable workspace with persisted panel sizes and visibility.
 * Hidden panels collapse fully; sizes are saved per `id` so different views
 * (builder, media, analytics) remember their own layout.
 */
export function MultiPanelWorkspace({ id, left, center, right, defaultSizes = [22, 56, 22] }: Props) {
  const panels = useWorkspaceLayout((s) => s.panels);
  const sizes = useWorkspaceLayout((s) => s.sizes[id]);
  const saveSizes = useWorkspaceLayout((s) => s.saveSizes);
  const focus = useWorkspaceLayout((s) => s.mode === "focus");

  const showLeft = !!left && panels.left && !focus;
  const showRight = !!right && panels.right && !focus;
  const initial = sizes && sizes.length === 3 ? sizes : defaultSizes;

  const onLayout = useCallback(
    (next: number[]) => {
      if (next.length !== 3) return;
      saveSizes(id, next);
    },
    [id, saveSizes],
  );

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      onLayoutChange={onLayout}
      className="h-full w-full"
    >
      {showLeft && (
        <>
          <ResizablePanel defaultSize={initial[0]} minSize={14} maxSize={40}>
            <div className="h-full overflow-hidden border-r bg-background">{left}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}
      <ResizablePanel defaultSize={initial[1]} minSize={30}>
        <div className="h-full min-w-0 overflow-auto">{center}</div>
      </ResizablePanel>
      {showRight && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={initial[2]} minSize={14} maxSize={40}>
            <div className="h-full overflow-hidden border-l bg-background">{right}</div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
