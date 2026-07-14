import { Check, ChevronsUpDown } from "lucide-react";
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

export function WorkspaceSwitcher() {
  const { workspace, workspaces } = useCurrentWorkspace();
  const name = workspace?.name ?? "Personal";
  const initial = name.charAt(0).toUpperCase();

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
        {workspaces.length === 0 && (
          <DropdownMenuItem disabled>No workspaces</DropdownMenuItem>
        )}
        {workspaces.map((w) => (
          <DropdownMenuItem key={w.id} className="justify-between">
            <span className="truncate">{w.name}</span>
            {w.id === workspace?.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
