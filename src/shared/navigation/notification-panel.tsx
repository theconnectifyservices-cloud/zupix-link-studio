import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores";

export function NotificationPanel() {
  const unread = useNotificationStore((s) => s.unreadCount);
  return (
    <Button variant="ghost" size="icon" aria-label={`Notifications (${unread} unread)`}>
      <span className="relative inline-flex">
        <Bell className="h-5 w-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </span>
    </Button>
  );
}
