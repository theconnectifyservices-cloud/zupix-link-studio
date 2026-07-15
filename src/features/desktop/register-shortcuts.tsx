import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Home,
  Plus,
  LayoutTemplate,
  ImagePlus,
  BarChart3,
  Sparkles,
  Settings,
  CreditCard,
  Users,
  Focus,
  Keyboard,
  Command as CmdIcon,
} from "lucide-react";
import { useShortcut } from "./shortcuts";
import { useCommandRegistry, type Command } from "./commands";
import { useUIStore } from "@/stores";
import { useWorkspaceLayout } from "./workspace-layout.store";
import { useShortcutsDialog } from "./ui.store";

/**
 * Registers global keyboard shortcuts and default palette commands. Mount
 * once inside authenticated shells — safe to unmount (it cleans up).
 */
export function DesktopShortcutsHost() {
  const navigate = useNavigate();
  const setPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleFocus = useWorkspaceLayout((s) => s.toggleFocus);
  const setFullscreen = useWorkspaceLayout((s) => s.setFullscreen);
  const setShortcuts = useShortcutsDialog((s) => s.setOpen);
  const register = useCommandRegistry((s) => s.register);

  // Navigation shortcuts
  useShortcut("mod+shift+n", (e) => {
    e.preventDefault();
    navigate({ to: "/app/projects", search: { new: "1" } as never });
  });
  useShortcut("mod+,", (e) => {
    e.preventDefault();
    navigate({ to: "/app/settings" });
  });
  useShortcut("mod+.", (e) => {
    e.preventDefault();
    toggleFocus();
  });
  useShortcut("shift+?", (e) => {
    e.preventDefault();
    setShortcuts(true);
  });
  useShortcut("f11", async (e) => {
    e.preventDefault();
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  });

  // Register default commands
  useEffect(() => {
    const commands: Command[] = [
      {
        id: "nav.dashboard",
        title: "Go to Dashboard",
        group: "Navigate",
        icon: Home,
        run: () => navigate({ to: "/app" }),
      },
      {
        id: "nav.projects",
        title: "Go to Projects",
        group: "Navigate",
        icon: LayoutTemplate,
        run: () => navigate({ to: "/app/projects" }),
      },
      {
        id: "nav.templates",
        title: "Go to Templates",
        group: "Navigate",
        icon: LayoutTemplate,
        run: () => navigate({ to: "/app/templates" }),
      },
      {
        id: "nav.media",
        title: "Go to Media Library",
        group: "Navigate",
        icon: ImagePlus,
        run: () => navigate({ to: "/app/media" }),
      },
      {
        id: "nav.analytics",
        title: "Go to Analytics",
        group: "Navigate",
        icon: BarChart3,
        run: () => navigate({ to: "/app/analytics" }),
      },
      {
        id: "nav.ai",
        title: "Open AI Workspace",
        group: "Navigate",
        icon: Sparkles,
        run: () => navigate({ to: "/app/ai" }),
      },
      {
        id: "nav.billing",
        title: "Open Billing",
        group: "Navigate",
        icon: CreditCard,
        run: () => navigate({ to: "/app/billing" }),
      },
      {
        id: "nav.team",
        title: "Open Team",
        group: "Navigate",
        icon: Users,
        run: () => navigate({ to: "/app/team" }),
      },
      {
        id: "nav.settings",
        title: "Open Settings",
        group: "Navigate",
        icon: Settings,
        shortcut: "mod+,",
        run: () => navigate({ to: "/app/settings" }),
      },
      {
        id: "create.bio",
        title: "Create new bio page",
        group: "Create",
        icon: Plus,
        shortcut: "mod+shift+n",
        run: () => navigate({ to: "/app/projects", search: { new: "1" } as never }),
      },
      {
        id: "view.focus",
        title: "Toggle focus mode",
        group: "Workspace",
        icon: Focus,
        shortcut: "mod+.",
        run: () => toggleFocus(),
      },
      {
        id: "view.shortcuts",
        title: "Show keyboard shortcuts",
        group: "Help",
        icon: Keyboard,
        shortcut: "shift+?",
        run: () => setShortcuts(true),
      },
      {
        id: "view.palette",
        title: "Open command palette",
        group: "Help",
        icon: CmdIcon,
        shortcut: "mod+k",
        run: () => setPaletteOpen(true),
      },
    ];
    return register(commands);
  }, [navigate, register, setPaletteOpen, setShortcuts, toggleFocus]);

  return null;
}
