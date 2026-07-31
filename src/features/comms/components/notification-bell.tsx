import { useState } from "react";
import {
  Bell,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Wrench,
  Trash2,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMyNotifications } from "../hooks";
import { TYPE_STYLE, relativeTime, type CommNotificationType, type FeedNotification } from "../types";

const ICONS: Record<CommNotificationType, typeof Info> = {
  information: Info,
  update: RefreshCw,
  success: CheckCircle2,
  warning: AlertTriangle,
  offer: Tag,
  maintenance: Wrench,
};

export function NotificationBell() {
  const { items, unreadCount, markRead, remove, markAllRead, isLoading } = useMyNotifications();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications (${unreadCount} unread)`}
          className="relative"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 animate-scale-in place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground">
                Product updates and offers will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((n) => (
                <NotificationRow
                  key={n.id}
                  item={n}
                  onRead={() => markRead(n.id)}
                  onDelete={() => remove(n.id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  item,
  onRead,
  onDelete,
}: {
  item: FeedNotification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const Icon = ICONS[item.type] ?? Info;
  const style = TYPE_STYLE[item.type];
  return (
    <li
      className={cn(
        "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
        !item.read_at && "bg-primary/5",
      )}
    >
      <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", style.chip)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm font-medium leading-snug">{item.title}</p>
          {!item.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        )}
        {item.banner_image_url && (
          <img
            src={item.banner_image_url}
            alt=""
            loading="lazy"
            decoding="async"
            className="mt-2 h-24 w-full rounded-lg object-cover"
          />
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{relativeTime(item.created_at)}</span>
          {item.button_text && item.button_url && (
            <a
              href={item.button_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onRead}
              className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/20"
            >
              {item.button_text} <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 sm:opacity-0">
            {!item.read_at && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Mark as read"
                onClick={onRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label="Delete notification"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
