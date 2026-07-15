import {
  LayoutDashboard,
  Link2,
  Images,
  LayoutTemplate,
  BarChart3,
  Target,
  Megaphone,
  Globe,
  Puzzle,
  Radar,
  Radio,
  Zap,
  Settings,
  LifeBuoy,
  ChevronLeft,
  Shield,
  Sparkles,
  Users,
  Building2,
  Gem,
  Paintbrush,
  Briefcase,
  Server,



} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app.config";

interface SidebarProps {
  variant?: "app" | "admin";
  className?: string;
}

type Item = {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  soon?: boolean;
  exact?: boolean;
};

const appItems: Item[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app", exact: true },
  { icon: Link2, label: "My Bio Pages", href: "/app/projects" },
  { icon: Images, label: "Media Library", href: "/app/media" },
  { icon: LayoutTemplate, label: "Templates", href: "/app/templates", soon: true },
  { icon: BarChart3, label: "Analytics", href: "/app/analytics", soon: true },
  { icon: Target, label: "Conversions", href: "/app/conversions" },
  { icon: Megaphone, label: "Campaigns", href: "/app/campaigns" },
  { icon: Globe, label: "Domains", href: "/app/domains" },
  { icon: Radar, label: "Tracking Center", href: "/app/tracking" },
  { icon: Radio, label: "Communications", href: "/app/communications" },
  { icon: Zap, label: "Automation", href: "/app/automation" },
  { icon: Sparkles, label: "ZUPIX AI", href: "/app/ai" },
  { icon: Users, label: "Workspace", href: "/app/team" },
  { icon: Building2, label: "Agency", href: "/app/agency" },
  { icon: Shield, label: "Enterprise", href: "/app/enterprise" },
  { icon: Gem, label: "Monetization", href: "/app/monetization" },
  { icon: Paintbrush, label: "White Label", href: "/app/white-label" },
  { icon: Briefcase, label: "Reseller", href: "/app/reseller" },
  { icon: Server, label: "Infrastructure", href: "/app/infrastructure" },
  { icon: Puzzle, label: "Integrations", href: "/app/integrations", soon: true },
];

const bottomItems: Item[] = [
  { icon: Settings, label: "Settings", href: "/app/settings/profile" },
  { icon: LifeBuoy, label: "Help & Support", href: "/app/help" },
];

const adminItems: Item[] = [{ icon: Shield, label: "Admin", href: "/app" }];

export function Sidebar({ variant = "app", className }: SidebarProps) {
  const items = variant === "admin" ? adminItems : appItems;
  const collapsed = !useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (item: Item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        aria-label="Primary navigation"
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-muted/30 transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-60",
          className,
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <Link to="/app" className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                Z
              </span>
              <span className="text-sm font-semibold tracking-tight">{APP_CONFIG.shortName}</span>
            </Link>
          )}
          {collapsed && (
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              Z
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <SidebarItems items={items} collapsed={collapsed} isActive={isActive} />
        </nav>

        <div className="space-y-1 border-t p-3">
          <SidebarItems items={bottomItems} collapsed={collapsed} isActive={isActive} />
          <Button
            variant="ghost"
            size="sm"
            className={cn("mt-2 w-full", collapsed && "px-0")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarOpen(collapsed)}
          >
            <ChevronLeft
              className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")}
            />
            {!collapsed && <span className="ml-2 text-xs text-muted-foreground">Collapse</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function SidebarItems({
  items,
  collapsed,
  isActive,
}: {
  items: Item[];
  collapsed: boolean;
  isActive: (i: Item) => boolean;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const active = isActive(item);
        const content = (
          <Link
            to={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            aria-current={active ? "page" : undefined}
          >
            {active && !collapsed && (
              <span className="absolute inset-y-1 left-0 w-1 rounded-r bg-primary" aria-hidden />
            )}
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.soon && (
                  <span className="ml-auto rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    Soon
                  </span>
                )}
              </>
            )}
          </Link>
        );
        return (
          <li key={item.href + item.label}>
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {item.soon ? " (soon)" : ""}
                </TooltipContent>
              </Tooltip>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
