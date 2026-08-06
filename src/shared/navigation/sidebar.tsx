import {
  LayoutDashboard,
  Link2,
  Images,
  LayoutTemplate,
  BarChart3,
  Target,
  Inbox,
  ShoppingBag,
  CalendarClock,
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
  Activity,
  ClipboardCheck,
  CloudCog,
  Award,
  Crown,
  KeyRound,
  Rocket,
  Bell,
  Wallet,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app.config";
import { useIsMobile } from "@/hooks/use-mobile";

import { useUserRoles } from "@/features/auth/hooks/use-user-roles";
import type { Permission } from "@/features/auth/rbac";

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
  /** Any of these permissions grants visibility. If omitted, always visible. */
  requires?: Permission[];
  /** If set, only shown when the user has any of these platform roles. */
  requiresRole?: Array<"admin" | "super_admin" | "moderator">;
};

const appItems: Item[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/app", exact: true },
  { icon: Link2, label: "My Bio Pages", href: "/app/projects" },
  { icon: Images, label: "Media Library", href: "/app/media" },
  { icon: LayoutTemplate, label: "Templates", href: "/app/templates", soon: true },
  { icon: BarChart3, label: "Analytics", href: "/app/analytics", soon: true },
  { icon: Target, label: "Conversions", href: "/app/conversions" },
  { icon: Wallet, label: "Payments", href: "/app/payments" },
  { icon: Inbox, label: "Leads", href: "/app/leads" },
  { icon: CalendarClock, label: "Bookings", href: "/app/bookings" },
  { icon: ShoppingBag, label: "Mini Store", href: "/app/store" },
  { icon: Megaphone, label: "Campaigns", href: "/app/campaigns" },
  { icon: Globe, label: "Domains", href: "/app/domains" },
  { icon: Radar, label: "Tracking Center", href: "/app/tracking" },
  { icon: Radio, label: "Communications", href: "/app/communications" },
  { icon: Zap, label: "Automation", href: "/app/automation" },
  { icon: Sparkles, label: "ZUPIX AI", href: "/app/ai" },
  { icon: Crown, label: "My Subscription", href: "/app/my-subscription" },
  { icon: KeyRound, label: "My License", href: "/app/license" },
  { icon: Sparkles, label: "What's New", href: "/app/whats-new" },

  { icon: Users, label: "Workspace", href: "/app/team" },
  { icon: Building2, label: "Agency", href: "/app/agency", requires: ["can_manage_agency"] },
  { icon: Shield, label: "Enterprise", href: "/app/enterprise", requires: ["can_manage_enterprise"] },
  { icon: Gem, label: "Monetization", href: "/app/monetization", requires: ["can_manage_monetization"] },
  { icon: Paintbrush, label: "White Label", href: "/app/white-label", requires: ["can_manage_whitelabel"] },
  { icon: Briefcase, label: "Reseller", href: "/app/reseller", requires: ["can_manage_reseller"] },
  { icon: Server, label: "Infrastructure", href: "/app/infrastructure", requires: ["can_manage_infrastructure"] },
  { icon: Activity, label: "Performance", href: "/app/performance", requires: ["can_manage_performance"] },
  { icon: Shield, label: "Security", href: "/app/security", requires: ["can_manage_security"] },
  { icon: ClipboardCheck, label: "Production QA", href: "/app/qa", requires: ["can_manage_qa"] },
  { icon: CloudCog, label: "Operations", href: "/app/operations", requires: ["can_manage_operations"] },
  { icon: Puzzle, label: "Integrations", href: "/app/integrations", soon: true },
  { icon: Award, label: "Launch Center", href: "/app/launch", requires: ["can_manage_launch"] },
  { icon: Shield, label: "Subscription Management", href: "/admin/subscription-management", requiresRole: ["admin", "super_admin"] },
  { icon: Shield, label: "Payment Hub", href: "/admin/payment-gateways", requiresRole: ["admin", "super_admin"] },
  { icon: KeyRound, label: "License Manager", href: "/admin/licenses", requiresRole: ["admin", "super_admin"] },
  { icon: Users, label: "User Management", href: "/admin/users", requiresRole: ["admin", "super_admin"] },
  { icon: Bell, label: "Communication Center", href: "/admin/communication-center", requiresRole: ["admin", "super_admin"] },
  { icon: Rocket, label: "App Update Center", href: "/admin/update-center", requiresRole: ["admin", "super_admin"] },

];

const bottomItems: Item[] = [
  { icon: Rocket, label: "Changelog", href: "/app/changelog" },
  { icon: Settings, label: "Settings", href: "/app/settings/profile" },
  { icon: LifeBuoy, label: "Help & Support", href: "/app/help" },
];

const adminItems: Item[] = [{ icon: Shield, label: "Admin", href: "/app" }];

/** Modules kept available on mobile (<768px) — everything else is desktop-only. */
const MOBILE_ALLOWED_HREFS = new Set(["/app", "/app/projects", "/app/settings/profile"]);

export function Sidebar({ variant = "app", className }: SidebarProps) {
  const rawItems = variant === "admin" ? adminItems : appItems;
  const collapsed = !useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isLoading: rolesLoading, hasAny, roles } = useUserRoles();
  const isMobile = useIsMobile();

  // While roles load, hide guarded items to prevent flash of unauthorized modules.
  const items = rawItems.filter((i) => {
    if (isMobile && !MOBILE_ALLOWED_HREFS.has(i.href)) return false;
    if (i.requires && !(!rolesLoading && hasAny(i.requires))) return false;
    if (i.requiresRole && !(!rolesLoading && i.requiresRole.some((r) => roles.includes(r as never)))) return false;
    return true;
  });

  const visibleBottomItems = isMobile
    ? bottomItems
        .filter((i) => MOBILE_ALLOWED_HREFS.has(i.href))
        .map((i) => (i.href === "/app/settings/profile" ? { ...i, label: "Profile" } : i))
    : bottomItems;


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
          <SidebarItems items={visibleBottomItems} collapsed={collapsed} isActive={isActive} />
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
