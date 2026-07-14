import { WorkspaceSwitcher } from "./workspace-switcher";
import { GlobalSearch } from "./global-search";
import { NotificationPanel } from "./notification-panel";
import { ProfileMenu } from "./profile-menu";
import { QuickActions } from "./quick-actions";

interface TopbarProps {
  variant?: "app" | "admin";
}

export function Topbar({ variant = "app" }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 sm:px-6">
      <WorkspaceSwitcher />
      <div className="mx-2 hidden max-w-md flex-1 md:block">
        <GlobalSearch />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <QuickActions />
        <NotificationPanel />
        <ProfileMenu variant={variant} />
      </div>
    </header>
  );
}
