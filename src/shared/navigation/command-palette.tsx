import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useUIStore } from "@/stores";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);

  useKeyboardShortcut("mod+k", (e) => {
    e.preventDefault();
    setOpen(!open);
  });

  useEffect(() => {
    // Placeholder — commands registered by features in later phases.
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Go to Dashboard</CommandItem>
          <CommandItem>Open Editor</CommandItem>
          <CommandItem>View Analytics</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
