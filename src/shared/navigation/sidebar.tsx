import { LayoutDashboard, Link2, BarChart3, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  variant?: "app" | "admin";
  className?: string;
}

const appItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/app" },
  { icon: Link2, label: "Editor", href: "/app/editor" },
  { icon: BarChart3, label: "Analytics", href: "/app/analytics" },
  { icon: Settings, label: "Settings", href: "/app/settings" },
];

const adminItems = [
  { icon: Shield, label: "Admin", href: "/admin" },
  { icon: LayoutDashboard, label: "Users", href: "/admin/users" },
];

/** Foundation sidebar — items wired in later phases via features/nav config. */
export function Sidebar({ variant = "app", className }: SidebarProps) {
  const items = variant === "admin" ? adminItems : appItems;
  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        "hidden w-60 shrink-0 border-r bg-muted/30 p-4 lg:block",
        className,
      )}
    >
      <nav>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
