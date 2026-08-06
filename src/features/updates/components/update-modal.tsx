import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Bug,
  CheckCircle2,
  Clock,
  Gauge,
  ShieldCheck,
  Sparkles,
  SkipForward,
  Info,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLatestUpdate, useUpdateStateMutation } from "../hooks";
import { applyAppUpdate } from "../apply-update";
import { canSkipVersion, RELEASE_TYPE_LABEL, RELEASE_TYPE_STYLE, type MyVersion } from "../types";

const SECTIONS = [
  { key: "whats_new", label: "What's New", icon: Sparkles, tone: "text-violet-500" },
  { key: "critical_info", label: "Production Readiness (RC-1)", icon: Info, tone: "text-amber-500" },
  { key: "bug_fixes", label: "Bug Fixes", icon: Bug, tone: "text-emerald-500" },
  {
    key: "performance_improvements",
    label: "Performance Improvements",
    icon: Gauge,
    tone: "text-sky-500",
  },
  { key: "security_updates", label: "Security Updates", icon: ShieldCheck, tone: "text-rose-500" },
] as const;

/**
 * Premium "New Update Available" modal.
 * Appears once per version per user, shortly after landing in the dashboard.
 */
export function UpdateModal() {
  const { update } = useLatestUpdate();
  const state = useUpdateStateMutation();
  const [open, setOpen] = useState(false);
  const [closedId, setClosedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const seenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!update || update.id === closedId) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [update, closedId]);

  useEffect(() => {
    if (!open || !update || seenRef.current === update.id) return;
    seenRef.current = update.id;
    state.mutate({ id: update.id, patch: { seen: true } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, update?.id]);

  if (!update) return null;

  const canSkip = canSkipVersion(update);

  function close(patch: { dismissed?: boolean; neverShow?: boolean; skipped?: boolean }) {
    if (!update) return;
    setOpen(false);
    setClosedId(update.id);
    state.mutate({ id: update.id, patch });
  }

  function skipVersion() {
    if (!update || !canSkipVersion(update)) return;
    const label = update.version;
    close({ skipped: true });
    toast.success(`Skipped v${label}`, {
      description: "You won't see this release again. Future updates will still appear.",
    });
  }

  async function updateNow() {
    if (!update) return;
    setApplying(true);
    try {
      await new Promise<void>((resolve) =>
        state.mutate(
          { id: update.id, patch: { read: true, updated: true } },
          { onSettled: () => resolve() },
        ),
      );
    } finally {
      await applyAppUpdate();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) return setOpen(true);
        if (update.is_forced) return; // forced updates cannot be escaped
        close({ dismissed: true });
      }}
    >
      <DialogContent
        onInteractOutside={(e) => {
          if (update.is_forced) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (update.is_forced) e.preventDefault();
        }}
        className={cn(
          "max-w-lg gap-0 overflow-hidden p-0",
          // forced updates cannot be closed — hide the built-in close affordance
          update.is_forced && "[&>button]:hidden",
        )}
      >
        <UpdateHeader update={update} />

        <ScrollArea className="max-h-[46vh]">
          <div className="space-y-5 px-6 py-5">
            {update.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{update.description}</p>
            )}

            {SECTIONS.map(({ key, label, icon: Icon, tone }) => {
              const items = update[key];
              if (!items?.length) return null;
              return (
                <section key={key} className="space-y-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className={cn("h-4 w-4", tone)} aria-hidden />
                    {label}
                  </h3>
                  <ul className="space-y-1.5">
                    {items.map((line, i) => (
                      <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70"
                          aria-hidden
                        />
                        <span className="leading-relaxed">{line}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {update.video_url && (
              <div className="overflow-hidden rounded-xl border">
                <iframe
                  src={update.video_url}
                  title={`${update.title} walkthrough`}
                  className="aspect-video w-full"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            )}

            {update.docs_url && (
              <a
                href={update.docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <BookOpen className="h-4 w-4" aria-hidden />
                Read the full documentation
              </a>
            )}
          </div>
        </ScrollArea>

        <footer className="flex flex-col gap-2 border-t bg-muted/30 px-6 py-4">
          <Button size="lg" onClick={updateNow} disabled={applying} className="w-full gap-2">
            {applying ? "Updating…" : "Update Now"}
            {!applying && <ArrowRight className="h-4 w-4" aria-hidden />}
          </Button>

          {!update.is_forced && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => close({ dismissed: true })}
              >
                <Clock className="h-4 w-4" aria-hidden />
                Remind me tomorrow
              </Button>

              {canSkip ? (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={skipVersion}>
                  <SkipForward className="h-4 w-4" aria-hidden />
                  Skip this version
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => close({ dismissed: true })}
                >
                  Later
                </Button>
              )}
            </div>
          )}

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full gap-1.5 text-muted-foreground"
          >
            <Link to="/app/changelog" onClick={() => close({ dismissed: true })}>
              <BookOpen className="h-4 w-4" aria-hidden />
              View changelog
            </Link>
          </Button>

          {!canSkip && !update.is_forced && (
            <p className="text-center text-xs text-muted-foreground">
              This is a critical update — it can be postponed, but not skipped.
            </p>
          )}
          {update.is_forced && (
            <p className="text-center text-xs text-muted-foreground">
              This is a required update and must be installed to continue.
            </p>
          )}
        </footer>

      </DialogContent>
    </Dialog>
  );
}

function UpdateHeader({ update }: { update: MyVersion }) {
  return (
    <div className="relative overflow-hidden">
      {update.banner_image_url ? (
        <img
          src={update.banner_image_url}
          alt=""
          className="h-36 w-full object-cover"
          decoding="async"
        />
      ) : (
        <div
          className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/20"
          aria-hidden
        />
      )}
      <div className="space-y-2 px-6 pb-4 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" aria-hidden />
            v{update.version}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1",
              RELEASE_TYPE_STYLE[update.release_type],
            )}
          >
            {RELEASE_TYPE_LABEL[update.release_type]}
          </span>
        </div>
        <DialogTitle className="text-xl leading-snug">{update.title}</DialogTitle>
        <DialogDescription className="text-xs">
          Released{" "}
          {new Date(update.release_date).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </DialogDescription>
      </div>
    </div>
  );
}
