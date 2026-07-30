import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONTACT_WIDGET,
  normalizeContactWidget,
  resolvedActions,
  type ContactWidgetAnimation,
  type ContactWidgetConfig,
} from "../types";
import { ContactIcon } from "./contact-icon";

interface Props {
  config?: Partial<ContactWidgetConfig> | null;
  /** Use absolute positioning (inside the builder preview frame). */
  embedded?: boolean;
  className?: string;
}

/** Hidden → visible transform for one menu item, per animation preset. */
function hiddenTransform(anim: ContactWidgetAnimation, index: number, isLeft: boolean): string {
  const dir = isLeft ? -1 : 1;
  switch (anim) {
    case "fade":
      return "translate3d(0,0,0)";
    case "slide":
      return `translate3d(${dir * 24}px,0,0)`;
    case "scale":
      return "scale(0.6)";
    case "arc":
      return `translate3d(${dir * (8 + index * 6)}px, ${12 + index * 4}px, 0) scale(0.8)`;
    case "spring":
    default:
      return "translate3d(0,16px,0) scale(0.85)";
  }
}

const SPRING_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
const SOFT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Premium Smart Contact Floating Widget.
 *
 * Zero third-party UI dependencies: transforms + opacity only (GPU
 * composited, 60fps), glassmorphism surface, full keyboard support with a
 * focus trap while the menu is open.
 */
export function ContactWidget({ config, embedded = false, className }: Props) {
  const cfg = useMemo(() => normalizeContactWidget(config), [config]);
  const items = useMemo(() => resolvedActions(cfg), [cfg]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const fabRef = useRef<HTMLButtonElement | null>(null);
  const menuId = useId();

  const close = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) fabRef.current?.focus();
  }, []);

  // Outside click / tap closes the menu.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, close]);

  // ESC closes; Tab is trapped inside the widget while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = rootRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !rootRef.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, close]);

  if (!cfg.enabled || items.length === 0) return null;

  const isLeft = cfg.position === "left";
  const ease = cfg.animation === "spring" || cfg.animation === "arc" ? SPRING_EASE : SOFT_EASE;

  return (
    <div
      ref={rootRef}
      className={cn(
        "z-50 flex flex-col items-stretch gap-2",
        embedded ? "absolute" : "fixed",
        isLeft ? "left-4 items-start sm:left-6" : "right-4 items-end sm:right-6",
        className,
      )}
      style={{ bottom: `calc(1rem + env(safe-area-inset-bottom, 0px))` }}
    >
      {/* Action menu — always mounted so opening costs no layout work. */}
      <ul
        id={menuId}
        role="menu"
        aria-label="Contact options"
        aria-hidden={!open}
        className={cn(
          "m-0 flex list-none flex-col gap-2 p-0",
          isLeft ? "items-start" : "items-end",
          !open && "pointer-events-none",
        )}
      >
        {items.map(({ action, href }, i) => {
          const delay = open ? i * 45 : (items.length - 1 - i) * 30;
          return (
            <li key={action.id} role="none" className="contents">
              <a
                role="menuitem"
                href={href}
                target={action.id === "phone" || action.id === "email" ? undefined : "_blank"}
                rel="noopener noreferrer"
                tabIndex={open ? 0 : -1}
                aria-label={action.label}
                onClick={() => close()}
                className={cn(
                  "group inline-flex items-center gap-2.5 rounded-full border border-white/25 bg-white/70 py-2 pl-2 pr-3.5 text-sm font-medium text-zinc-900 no-underline shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-xl outline-none",
                  "hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-50 dark:hover:bg-zinc-900/85",
                  isLeft && "flex-row-reverse pl-3.5 pr-2",
                )}
                style={{
                  opacity: open ? 1 : 0,
                  transform: open
                    ? "translate3d(0,0,0) scale(1)"
                    : hiddenTransform(cfg.animation, i, isLeft),
                  transition: `opacity 220ms ${SOFT_EASE} ${delay}ms, transform 320ms ${ease} ${delay}ms`,
                  willChange: "transform, opacity",
                }}
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm"
                  style={{ background: action.color ?? cfg.color }}
                >
                  <ContactIcon
                    name={action.icon ?? "message"}
                    className="h-4 w-4"
                  />
                </span>
                <span className="whitespace-nowrap">{action.label}</span>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Floating action button — always visible. */}
      <button
        ref={fabRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={open ? "Close contact options" : (cfg.buttonLabel || "Contact options")}
        className={cn(
          "inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 shadow-[0_10px_30px_rgba(0,0,0,0.24)] outline-none backdrop-blur-xl",
          "transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 motion-reduce:transition-none",
          isLeft ? "self-start" : "self-end",
        )}
        style={{
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.colorSecondary})`,
          color: cfg.foreground,
          willChange: "transform",
        }}
      >
        <span
          className="grid place-items-center"
          style={{
            transform: open ? "rotate(135deg)" : "rotate(0deg)",
            transition: `transform 320ms ${ease}`,
          }}
        >
          {open ? (
            <ContactIcon name="plus" className="h-6 w-6" />
          ) : (
            <ContactIcon name={cfg.icon ?? DEFAULT_CONTACT_WIDGET.icon} className="h-6 w-6" />
          )}
        </span>
      </button>
    </div>
  );
}
