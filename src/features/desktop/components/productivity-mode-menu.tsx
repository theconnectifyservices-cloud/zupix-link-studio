import { Focus, Maximize2, Minimize2, Rows3, Rows4, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceLayout, type ProductivityMode } from "../workspace-layout.store";

const MODES: { key: ProductivityMode; label: string; icon: typeof Sparkles }[] = [
  { key: "normal", label: "Normal", icon: Sparkles },
  { key: "focus", label: "Focus mode", icon: Focus },
  { key: "compact", label: "Compact", icon: Rows3 },
  { key: "dense", label: "Dense tables", icon: Rows4 },
];

/** Menu to switch productivity modes and toggle full screen. */
export function ProductivityModeMenu() {
  const mode = useWorkspaceLayout((s) => s.mode);
  const setMode = useWorkspaceLayout((s) => s.setMode);
  const fullscreen = useWorkspaceLayout((s) => s.fullscreen);
  const setFullscreen = useWorkspaceLayout((s) => s.setFullscreen);

  const toggleFs = async () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Productivity mode">
          <Focus className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Workspace mode</DropdownMenuLabel>
        {MODES.map((m) => (
          <DropdownMenuCheckboxItem
            key={m.key}
            checked={mode === m.key}
            onCheckedChange={() => setMode(m.key)}
          >
            <m.icon className="mr-2 h-4 w-4" />
            {m.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={fullscreen} onCheckedChange={toggleFs}>
          {fullscreen ? (
            <Minimize2 className="mr-2 h-4 w-4" />
          ) : (
            <Maximize2 className="mr-2 h-4 w-4" />
          )}
          Full screen
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
