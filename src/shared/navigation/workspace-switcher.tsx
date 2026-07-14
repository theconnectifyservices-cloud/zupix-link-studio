import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/stores";

export function WorkspaceSwitcher() {
  const current = useWorkspaceStore((s) => s.current);
  return (
    <Button variant="ghost" className="gap-2" aria-label="Switch workspace">
      <span className="grid h-6 w-6 place-items-center rounded bg-primary text-xs font-semibold text-primary-foreground">
        {(current?.name ?? "Z").charAt(0)}
      </span>
      <span className="hidden text-sm sm:inline">{current?.name ?? "Personal"}</span>
      <ChevronsUpDown className="h-4 w-4 text-muted-foreground" aria-hidden />
    </Button>
  );
}
