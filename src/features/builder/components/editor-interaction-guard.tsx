import type { ReactNode, MouseEvent as ReactMouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Editor-mode interaction guard.
 *
 * Wraps rendered block content inside the builder canvas. In editor mode any
 * pointer interaction is captured before it reaches links, buttons or embeds:
 * navigation (`href`, `tel:`, `mailto:`, external URLs) never runs, media never
 * plays, and the click is turned into a block selection instead.
 *
 * In live preview / published mode the guard is inert — children behave exactly
 * as they do on the public page.
 */
export function EditorInteractionGuard({
  active,
  onSelect,
  className,
  children,
}: {
  /** True while editing (guard on). False in live preview. */
  active: boolean;
  /** Called instead of the native action when a click is intercepted. */
  onSelect?: (e: ReactMouseEvent) => void;
  className?: string;
  children: ReactNode;
}) {
  if (!active) return <>{children}</>;

  const swallow = (e: ReactMouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn(
        // Embeds (YouTube/Vimeo/custom code) and media can't be reached by
        // capture-phase handlers, so neutralise their pointer surface.
        "[&_audio]:pointer-events-none [&_embed]:pointer-events-none [&_iframe]:pointer-events-none [&_object]:pointer-events-none [&_video]:pointer-events-none",
        className,
      )}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect?.(e);
      }}
      onAuxClickCapture={swallow}
      onDoubleClickCapture={swallow}
      onMouseDownCapture={(e) => {
        // Keeps focus off links/buttons; drag handles live outside this guard.
        e.preventDefault();
      }}
      onDragStartCapture={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
