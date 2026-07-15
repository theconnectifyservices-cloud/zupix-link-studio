import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Pin, Clock, Search, Command as CmdIcon, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores";
import { useShortcut, formatShortcut } from "../shortcuts";
import { useCommandRegistry, useCommandHistory, type Command } from "../commands";
import { globalSearch, type SearchResult } from "../search";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * Desktop command palette. Merges the runtime command registry, recent /
 * pinned commands, and remote global search into a single ⌘K surface.
 */
export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const navigate = useNavigate();
  const { workspace } = useCurrentWorkspace();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 180);
  const [results, setResults] = useState<SearchResult[]>([]);
  const commands = useCommandRegistry((s) => s.commands);
  const recent = useCommandHistory((s) => s.recent);
  const pinned = useCommandHistory((s) => s.pinned);
  const pushRecent = useCommandHistory((s) => s.pushRecent);
  const togglePinned = useCommandHistory((s) => s.togglePinned);

  useShortcut("mod+k", (e) => {
    e.preventDefault();
    setOpen(!open);
  });
  useShortcut("mod+/", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    globalSearch(debounced, workspace?.id ?? null).then((r) => {
      if (!cancelled) setResults(r);
    });
    return () => {
      cancelled = true;
    };
  }, [debounced, workspace?.id]);

  const allCommands = useMemo(() => Array.from(commands.values()), [commands]);
  const byId = useMemo(() => new Map(allCommands.map((c) => [c.id, c])), [allCommands]);
  const pinnedCmds = pinned.map((id) => byId.get(id)).filter(Boolean) as Command[];
  const recentCmds = recent
    .filter((id) => !pinned.includes(id))
    .map((id) => byId.get(id))
    .filter(Boolean) as Command[];

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of allCommands) {
      const g = c.group ?? "Actions";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(c);
    }
    return Array.from(map.entries());
  }, [allCommands]);

  const runCommand = (cmd: Command) => {
    pushRecent(cmd.id);
    setOpen(false);
    void cmd.run();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search or run a command…"
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-1 py-6 text-sm text-muted-foreground">
            <Search className="h-5 w-5" />
            No matches
          </div>
        </CommandEmpty>

        {results.length > 0 && (
          <CommandGroup heading="Search results">
            {results.map((r) => (
              <CommandItem
                key={r.id}
                value={`search-${r.id}-${r.title}`}
                onSelect={() => {
                  setOpen(false);
                  if (r.to)
                    navigate({ to: r.to, params: r.params as never, search: {} as never });
                }}
              >
                <ArrowRight className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">{r.title}</span>
                  {r.subtitle && (
                    <span className="truncate text-xs text-muted-foreground">{r.subtitle}</span>
                  )}
                </div>
                <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                  {r.scope}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!query && pinnedCmds.length > 0 && (
          <>
            <CommandGroup heading="Pinned">
              {pinnedCmds.map((c) => (
                <PaletteRow key={c.id} cmd={c} onRun={runCommand} onPin={togglePinned} pinned />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {!query && recentCmds.length > 0 && (
          <>
            <CommandGroup heading="Recent">
              {recentCmds.slice(0, 5).map((c) => (
                <PaletteRow
                  key={c.id}
                  cmd={c}
                  onRun={runCommand}
                  onPin={togglePinned}
                  icon={<Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
                />
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {grouped.map(([group, list]) => (
          <CommandGroup key={group} heading={group}>
            {list.map((c) => (
              <PaletteRow
                key={c.id}
                cmd={c}
                onRun={runCommand}
                onPin={togglePinned}
                pinned={pinned.includes(c.id)}
              />
            ))}
          </CommandGroup>
        ))}

        {allCommands.length === 0 && !results.length && !query && (
          <CommandGroup heading="Tips">
            <CommandItem disabled>
              <CmdIcon className="mr-2 h-4 w-4" />
              Type to search — commands from the app appear here as you use them.
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function PaletteRow({
  cmd,
  onRun,
  onPin,
  pinned,
  icon,
}: {
  cmd: Command;
  onRun: (c: Command) => void;
  onPin: (id: string) => void;
  pinned?: boolean;
  icon?: React.ReactNode;
}) {
  const Icon = cmd.icon;
  return (
    <CommandItem
      value={`${cmd.id}-${cmd.title}-${cmd.keywords?.join(" ") ?? ""}`}
      onSelect={() => onRun(cmd)}
      className="group"
    >
      {icon ?? (Icon ? <Icon className="mr-2 h-4 w-4 text-muted-foreground" /> : null)}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{cmd.title}</span>
        {cmd.subtitle && (
          <span className="truncate text-xs text-muted-foreground">{cmd.subtitle}</span>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPin(cmd.id);
        }}
        aria-label={pinned ? "Unpin command" : "Pin command"}
        className="ml-2 rounded p-1 opacity-0 hover:bg-accent group-hover:opacity-100 data-[pinned=true]:opacity-100"
        data-pinned={pinned ? "true" : "false"}
      >
        <Pin
          className={`h-3.5 w-3.5 ${pinned ? "fill-current text-primary" : "text-muted-foreground"}`}
        />
      </button>
      {cmd.shortcut && (
        <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {formatShortcut(cmd.shortcut)}
        </kbd>
      )}
    </CommandItem>
  );
}
