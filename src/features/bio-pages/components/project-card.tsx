import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Pencil,
  ExternalLink,
  Globe,
  Lock,
  EyeOff,
  FileEdit,
  CheckCircle2,
  Loader2,
  Share2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  archiveBioPage,
  deleteBioPage,
  duplicateBioPage,
  renameBioPage,
  restoreBioPage,
  type BioPageRow,
} from "../api";

const statusMeta: Record<
  BioPageRow["status"],
  { label: string; className: string; icon: typeof FileEdit }
> = {
  draft: { label: "Draft", className: "bg-muted text-foreground", icon: FileEdit },
  published: {
    label: "Published",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
    icon: Loader2,
  },
  unpublished: {
    label: "Unpublished",
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
    icon: EyeOff,
  },
  archived: {
    label: "Archived",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    icon: Archive,
  },
};

const visibilityIcon = {
  public: Globe,
  private: Lock,
  unlisted: EyeOff,
  password: Lock,
} as const;

export function ProjectCard({
  project,
  view = "grid",
}: {
  project: BioPageRow;
  view?: "grid" | "list";
}) {
  const qc = useQueryClient();
  const [renameOpen, setRenameOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [name, setName] = useState(project.name);
  const [busy, setBusy] = useState(false);

  const Status = statusMeta[project.status];
  const VisIcon = visibilityIcon[project.visibility];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["bio-pages"] });

  async function withBusy(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await invalidate();
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const isList = view === "list";
  const updated = useMemo(
    () => formatDistanceToNow(new Date(project.updated_at), { addSuffix: true }),
    [project.updated_at],
  );
  const created = useMemo(
    () => new Date(project.created_at).toLocaleDateString(),
    [project.created_at],
  );

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Project actions" disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/builder/$id" params={{ id: project.id }}>
            <FileEdit className="mr-2 h-4 w-4" /> Edit in builder
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRenameOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => withBusy(() => duplicateBioPage(project), "Project duplicated")}
        >
          <Copy className="mr-2 h-4 w-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShareOpen(true)}>
          <Share2 className="mr-2 h-4 w-4" /> Share & QR
        {project.status === "archived" ? (
          <DropdownMenuItem
            onClick={() => withBusy(() => restoreBioPage(project.id), "Project restored")}
          >
            <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => withBusy(() => archiveBioPage(project.id), "Project archived")}
          >
            <Archive className="mr-2 h-4 w-4" /> Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const shareLink = `zupix.link/${project.slug}`;

  return (
    <>
      <Card
        className={cn(
          "group relative overflow-hidden transition-all hover:shadow-md",
          isList && "flex flex-row items-center gap-4 p-4",
        )}
      >
        {!isList && (
          <>
            <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-background">
              <div className="text-3xl font-bold uppercase text-primary/70">
                {project.name.charAt(0)}
              </div>
              <Badge
                className={cn("absolute right-3 top-3 gap-1 border-0", Status.className)}
                variant="secondary"
              >
                <Status.icon className="h-3 w-3" />
                {Status.label}
              </Badge>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{project.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <VisIcon className="h-3 w-3 shrink-0" /> {shareLink}
                  </p>
                </div>
                {menu}
              </div>
            </CardHeader>
            <CardContent className="pb-2 pt-0">
              {project.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t bg-muted/30 py-2 text-xs text-muted-foreground">
              <span>Updated {updated}</span>
              <span>Created {created}</span>
            </CardFooter>
          </>
        )}

        {isList && (
          <>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary/15 to-primary/5 text-lg font-bold uppercase text-primary">
              {project.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold">{project.name}</h3>
                <Badge className={cn("gap-1 border-0", Status.className)} variant="secondary">
                  <Status.icon className="h-3 w-3" />
                  {Status.label}
                </Badge>
              </div>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <VisIcon className="h-3 w-3 shrink-0" /> {shareLink}
              </p>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground md:block">
              <div>Updated {updated}</div>
              <div>Created {created}</div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Open" asChild>
              <a href={`https://${shareLink}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            {menu}
          </>
        )}
      </Card>

      {/* Rename dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename">Project name</Label>
            <Input id="rename" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy || name.trim().length < 2}
              onClick={async () => {
                await withBusy(() => renameBioPage(project.id, name.trim()), "Project renamed");
                setRenameOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <span className="font-medium text-foreground">{project.name}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => withBusy(() => deleteBioPage(project.id), "Project deleted")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
