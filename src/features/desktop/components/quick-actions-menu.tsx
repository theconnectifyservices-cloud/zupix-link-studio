import { useNavigate } from "@tanstack/react-router";
import {
  Plus,
  LayoutTemplate,
  ImagePlus,
  BarChart3,
  Sparkles,
  CreditCard,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/stores";

/** One-click quick actions launcher for the topbar. */
export function QuickActionsMenu() {
  const navigate = useNavigate();
  const openPalette = useUIStore((s) => s.setCommandPaletteOpen);
  const go = (to: string, search: Record<string, string> = {}) =>
    navigate({ to, search: search as never });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1" aria-label="Quick actions">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => go("/app/projects", { new: "1" })}>
          <Plus className="mr-2 h-4 w-4" /> New bio page
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("/app/templates")}>
          <LayoutTemplate className="mr-2 h-4 w-4" /> New template
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("/app/media", { upload: "1" })}>
          <ImagePlus className="mr-2 h-4 w-4" /> Upload asset
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Open</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => go("/app/analytics")}>
          <BarChart3 className="mr-2 h-4 w-4" /> Analytics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("/app/ai")}>
          <Sparkles className="mr-2 h-4 w-4" /> AI workspace
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("/app/billing")}>
          <CreditCard className="mr-2 h-4 w-4" /> Billing
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("/app/settings")}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openPalette(true)}>
          <span className="mr-2 text-xs">⌘K</span> Open command palette
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
