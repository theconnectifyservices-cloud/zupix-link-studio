import { useState } from "react";
import {
  Archive,
  BarChart3,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAdminVersions, useVersionAnalytics, useVersionMutations } from "../../hooks";
import {
  PRIORITY_LABEL,
  PRIORITY_STYLE,
  RELEASE_TYPE_LABEL,
  RELEASE_TYPE_STYLE,
  STATUS_LABEL,
  STATUS_STYLE,
  VISIBILITY_LABEL,
  type PlatformVersion,
} from "../../types";
import { VersionEditor } from "./version-editor";

/** Admin console for the ZUPIX App Update Center. */
export function UpdateCenterAdmin() {
  const { data, isLoading } = useAdminVersions();
  const { save, remove, setStatus } = useVersionMutations();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformVersion | null>(null);
  const [deleting, setDeleting] = useState<PlatformVersion | null>(null);
  const [analyticsFor, setAnalyticsFor] = useState<string | null>(null);

  const versions = data ?? [];

  function openNew() {
    setEditing(null);
    setEditorOpen(true);
  }
  function openEdit(v: PlatformVersion) {
    setEditing(v);
    setEditorOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">App Update Center</h1>
          <p className="text-sm text-muted-foreground">
            Publish version releases, target the right customers and track adoption.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" aria-hidden />
          New Version
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : versions.length === 0 ? (
        <Card className="p-12 text-center">
          <Rocket className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            No versions yet. Create your first release to start notifying customers.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {versions.map((v) => (
            <Card key={v.id} className="overflow-hidden">
              <div className="flex flex-wrap items-start gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                      v{v.version}
                    </span>
                    <Chip className={STATUS_STYLE[v.status]}>{STATUS_LABEL[v.status]}</Chip>
                    <Chip className={cn("ring-1", RELEASE_TYPE_STYLE[v.release_type])}>
                      {RELEASE_TYPE_LABEL[v.release_type]}
                    </Chip>
                    <Chip className={PRIORITY_STYLE[v.priority]}>
                      {PRIORITY_LABEL[v.priority]}
                    </Chip>
                    {v.is_forced && (
                      <Chip className="bg-rose-500/10 text-rose-600 dark:text-rose-400">
                        Forced
                      </Chip>
                    )}
                    {v.is_pinned && <Chip className="bg-muted text-muted-foreground">Pinned</Chip>}
                  </div>
                  <p className="truncate text-sm font-semibold">{v.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {VISIBILITY_LABEL[v.visibility]}
                    {v.visibility === "plan" && v.target_plans.length > 0
                      ? ` · ${v.target_plans.join(", ")}`
                      : ""}
                    {v.visibility === "users" ? ` · ${v.target_user_ids.length} users` : ""}
                    {" · "}
                    {new Date(v.release_date).toLocaleDateString()}
                    {v.status === "scheduled" && v.publish_at
                      ? ` · goes live ${new Date(v.publish_at).toLocaleString()}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <IconButton label="Analytics" onClick={() => setAnalyticsFor(v.id)}>
                    <BarChart3 className="h-4 w-4" aria-hidden />
                  </IconButton>
                  <IconButton label="Edit" onClick={() => openEdit(v)}>
                    <Pencil className="h-4 w-4" aria-hidden />
                  </IconButton>
                  {v.status !== "published" ? (
                    <IconButton
                      label="Publish now"
                      onClick={() => setStatus.mutate({ id: v.id, status: "published" })}
                    >
                      <Rocket className="h-4 w-4" aria-hidden />
                    </IconButton>
                  ) : (
                    <IconButton
                      label="Move back to draft"
                      onClick={() => setStatus.mutate({ id: v.id, status: "draft" })}
                    >
                      <Undo2 className="h-4 w-4" aria-hidden />
                    </IconButton>
                  )}
                  {v.status !== "archived" && (
                    <IconButton
                      label="Archive"
                      onClick={() => setStatus.mutate({ id: v.id, status: "archived" })}
                    >
                      <Archive className="h-4 w-4" aria-hidden />
                    </IconButton>
                  )}
                  <IconButton label="Delete" destructive onClick={() => setDeleting(v)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </IconButton>
                </div>
              </div>

              {analyticsFor === v.id && <AnalyticsStrip versionId={v.id} />}
            </Card>
          ))}
        </div>
      )}

      <VersionEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        saving={save.isPending}
        onSave={(draft) =>
          save.mutate(draft, {
            onSuccess: () => setEditorOpen(false),
          })
        }
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete v{deleting?.version}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the release and every customer's read state for it. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleting) remove.mutate(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AnalyticsStrip({ versionId }: { versionId: string }) {
  const { data, isLoading } = useVersionAnalytics(versionId);
  if (isLoading || !data) {
    return <Skeleton className="mx-4 mb-4 h-20 rounded-xl sm:mx-5" />;
  }
  const stats = [
    { label: "Eligible", value: data.eligible },
    { label: "Seen", value: data.seen },
    { label: "Updated", value: data.updated },
    { label: "Read", value: data.read },
    { label: "Ignored", value: data.ignored },
    { label: "Pending", value: data.pending },
    { label: "Dismiss rate", value: `${data.dismiss_rate}%` },
  ];
  return (
    <div className="grid grid-cols-2 gap-px border-t bg-border sm:grid-cols-4 lg:grid-cols-7">
      {stats.map((s) => (
        <div key={s.label} className="bg-card px-4 py-3">
          <p className="text-lg font-semibold tabular-nums">{s.value}</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        className,
      )}
    >
      {children}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn("h-8 w-8", destructive && "text-destructive hover:text-destructive")}
    >
      {children}
    </Button>
  );
}
