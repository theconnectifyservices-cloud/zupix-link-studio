import { useUIStore } from "@/stores";
import { SearchInput } from "@/shared/ui/search-input";

export function GlobalSearch() {
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  return (
    <SearchInput
      readOnly
      onClick={() => setOpen(true)}
      onFocus={() => setOpen(true)}
      placeholder="Search…  (⌘K)"
      aria-label="Open global search"
    />
  );
}
