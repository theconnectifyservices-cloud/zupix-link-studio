import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { switchActiveWorkspace } from "@/features/workspace/api";

export function WorkspaceSwitcher() {
  const { workspace, workspaces, userId } = useCurrentWorkspace();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const name = workspace?.name ?? "Personal";
  const initial = name.charAt(0).toUpperCase();

  const switchMut = useMutation({
    mutationFn: (wsId: string) => switchActiveWorkspace(userId!, wsId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      qc.invalidateQueries({ queryKey: ["workspaces", userId] });
      toast.success("Workspace switched");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2 sm:px-3" aria-label="Switch workspace">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary text-xs font-semibold text-primary-foreground">
            {initial}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm sm:inline">{name}</span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.length === 0 && <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>}
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            className="justify-between"
            onClick={() => userId && w.id !== workspace?.id && switchMut.mutate(w.id)}
          >
            <span className="truncate">{w.name}</span>
            {w.id === workspace?.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: "/app/team" })}>
          <Plus className="mr-2 h-4 w-4" /> Manage workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
