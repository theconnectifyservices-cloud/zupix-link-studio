import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMyNotifications } from "../hooks";
import { TYPE_LABEL, TYPE_STYLE } from "../types";
import { cn } from "@/lib/utils";

/**
 * Shows the highest-priority "important" notification once per user, right
 * after they land in the dashboard.
 */
export function ImportantNotificationPopup() {
  const { items, markPopupSeen, markRead } = useMyNotifications();
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const target = useMemo(
    () => items.find((n) => n.priority === "important" && !n.popup_seen_at),
    [items],
  );

  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!target || target.id === dismissedId) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, [target, dismissedId]);

  if (!target) return null;

  function close() {
    if (!target) return;
    setOpen(false);
    setDismissedId(target.id);
    markPopupSeen(target.id);
  }

  const style = TYPE_STYLE[target.type];

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? close() : setOpen(true))}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        {target.banner_image_url && (
          <img
            src={target.banner_image_url}
            alt=""
            className="h-40 w-full object-cover"
            decoding="async"
          />
        )}
        <div className="space-y-3 p-6">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
              style.chip,
            )}
          >
            {TYPE_LABEL[target.type]}
          </span>
          <h2 className="text-lg font-semibold leading-snug">{target.title}</h2>
          {target.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{target.description}</p>
          )}
          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            {target.button_text && target.button_url && (
              <Button asChild className="sm:flex-1">
                <a
                  href={target.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    markRead(target.id);
                    close();
                  }}
                >
                  {target.button_text}
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={close} className="sm:flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
