import { History, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSkippedVersions, useUpdateStateMutation } from "../hooks";
import { RELEASE_TYPE_LABEL, RELEASE_TYPE_STYLE, type MyVersion } from "../types";

/**
 * Settings → Update Preferences.
 * Lists every release the user skipped and lets them bring it back,
 * which makes the update popup appear for that version again.
 */
export function UpdatePreferences() {
  const { skipped, isLoading } = useSkippedVersions();
  const state = useUpdateStateMutation();

  function restore(v: MyVersion) {
    state.mutate(
      { id: v.id, patch: { skipped: false, dismissed: false } },
      {
        onSuccess: () =>
          toast.success(`v${v.version} restored`, {
            description: "The update notification will appear again shortly.",
          }),
        onError: (e: Error) => toast.error(e.message || "Could not restore this version"),
      },
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
          <SkipForward className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold">Skipped versions</h2>
          <p className="text-sm text-muted-foreground">
            Releases you chose to skip. Skipping only hides that one version — new releases are
            always announced. Critical updates can never be skipped.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : skipped.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
          <History className="h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">No skipped versions</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            When you choose “Skip this version” on an update, it will show up here so you can bring
            it back any time.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {skipped.map((v) => (
            <li key={v.id}>
              <Card className="flex flex-col gap-3 p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold tabular-nums">v{v.version}</span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
                        RELEASE_TYPE_STYLE[v.release_type],
                      )}
                    >
                      {RELEASE_TYPE_LABEL[v.release_type]}
                    </span>
                  </div>
                  <p className="truncate text-sm font-medium">{v.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Skipped{" "}
                    {v.skipped_at ? new Date(v.skipped_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  disabled={state.isPending}
                  onClick={() => restore(v)}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Show this version again
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
