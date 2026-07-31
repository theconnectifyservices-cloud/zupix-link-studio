import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LayoutGrid, Palette, UserRound } from "lucide-react";

interface Item {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

/** Mobile Limited Mode: only core modules are reachable below 768px. */
const items: Item[] = [
  { to: "/app", label: "Home", icon: LayoutDashboard, exact: true },
  { to: "/app/projects", label: "Pages", icon: LayoutGrid },
  { to: "/app/templates", label: "Themes", icon: Palette },
  { to: "/app/settings/profile", label: "Profile", icon: UserRound },
];

/** Bottom navigation for mobile & tablet portrait — hidden on lg+. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="grid grid-cols-4">

        {items.map((it) => {
          const Icon = it.icon;
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                activeOptions={{ exact: it.exact }}
                activeProps={{ className: "text-primary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-medium active:bg-accent"
              >
                <Icon className="h-5 w-5" />
                <span className="truncate">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
