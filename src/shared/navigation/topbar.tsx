import { WorkspaceSwitcher } from "./workspace-switcher";
import { GlobalSearch } from "./global-search";
import { NotificationPanel } from "./notification-panel";
import { ProfileMenu } from "./profile-menu";
import { QuickActions } from "./quick-actions";
import { MobileSidebarTrigger } from "./mobile-sidebar-trigger";

interface TopbarProps {
  variant?: "app" | "admin";
}

export function Topbar({ variant = "app" }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:gap-3 sm:px-6">
      <MobileSidebarTrigger />
      <WorkspaceSwitcher />
      <div className="mx-2 hidden max-w-md flex-1 md:block">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <QuickActions />
        <NotificationPanel />
        <ProfileMenu variant={variant} />
      </div>
    </header>
  );
}
