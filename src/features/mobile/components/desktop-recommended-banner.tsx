import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "zupix.mobile.desktopBannerDismissed";

/**
 * Dismissible banner shown on mobile (<768px) explaining that advanced
 * modules are desktop-only. "Don't show again" persists to localStorage.
 */
export function DesktopRecommendedBanner() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!isMobile || !visible) return null;

  const dismissForever = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="mb-4 rounded-xl border bg-muted/40 p-4 shadow-sm backdrop-blur"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h2 className="min-w-0 text-sm font-semibold leading-snug">
            Desktop Experience Recommended
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          aria-label="Dismiss"
          onClick={() => setVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        For the best editing experience and access to advanced features such as Analytics,
        Domains, Integrations, Automation, and Workspace settings, please use a Desktop, Laptop,
        or Tablet.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Mobile is optimized for quick edits, project management, and publishing.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" className="min-h-9" onClick={() => setVisible(false)}>
          Continue on Mobile
        </Button>
        <Button size="sm" variant="outline" className="min-h-9" onClick={dismissForever}>
          Don&apos;t show again
        </Button>
      </div>
    </div>
  );
}
