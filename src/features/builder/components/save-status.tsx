/**
 * Shared save-state UI for the builder.
 * - `SaveStatusBadge`: status pill (idle / dirty / saving / saved / error)
 * - `SaveActionButton`: Save CTA that turns success-green after a save
 * Both use aria-live so screen readers announce state changes.
 */
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, CircleDot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { useBuilderStore } from "../store";

export type SaveStatus = ReturnType<typeof useBuilderStore.getState>["saveStatus"];

const STATE = {
  idle: { icon: CircleDot, label: "Ready" },
  dirty: { icon: CircleDot, label: "Unsaved changes" },
  saving: { icon: Loader2, label: "Saving…" },
  saved: { icon: Check, label: "Saved" },
  error: { icon: AlertCircle, label: "Save failed" },
} as const;

const TONE: Record<SaveStatus, string> = {
  idle: "border-transparent bg-muted text-muted-foreground",
  dirty: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  saving: "border-primary/30 bg-primary/10 text-primary",
  saved:
    "border-success-border bg-success text-success-foreground shadow-[0_0_0_1px_var(--success-border),0_4px_14px_-4px_var(--success)]",
  error: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function SaveStatusBadge({
  status,
  compact = false,
  className,
}: {
  status: SaveStatus;
  compact?: boolean;
  className?: string;
}) {
  const it = STATE[status];
  const Icon = it.icon;
  const label = compact && status === "dirty" ? "Unsaved" : it.label;

  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-medium transition-colors duration-200 ease-[var(--ease-standard)]",
        compact ? "h-6 px-2 text-[10px]" : "h-7 px-2.5 text-xs",
        TONE[status],
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="flex items-center gap-1.5 leading-none"
        >
          <Icon
            aria-hidden
            className={cn(
              compact ? "h-3 w-3" : "h-3.5 w-3.5",
              status === "saving" && "animate-spin",
            )}
          />
          {label}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function SaveActionButton({
  saving,
  isDirty,
  canSave,
  onSave,
  className,
}: {
  saving: boolean;
  isDirty: boolean;
  canSave: boolean;
  onSave: () => void;
  className?: string;
}) {
  const state: "saving" | "dirty" | "saved" = saving ? "saving" : isDirty ? "dirty" : "saved";

  return (
    <Button
      size="sm"
      onClick={onSave}
      disabled={!canSave || saving}
      aria-label="Save changes"
      aria-live="polite"
      className={cn(
        "h-8 min-w-[92px] justify-center gap-1.5 rounded-full px-3 text-xs font-medium shadow-sm transition-all duration-200 ease-[var(--ease-standard)]",
        state === "dirty" &&
          "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90",
        state === "saving" && "bg-primary/15 text-primary disabled:opacity-100",
        state === "saved" &&
          "border border-success-border bg-success text-success-foreground shadow-[0_0_0_1px_var(--success-border),0_6px_18px_-6px_var(--success)] disabled:opacity-100",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
          className="flex items-center gap-1.5 leading-none"
        >
          {state === "saving" ? (
            <>
              <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
              Saving…
            </>
          ) : state === "dirty" ? (
            "Save"
          ) : (
            <>
              <Check aria-hidden className="h-3.5 w-3.5" />
              Saved
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
