import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "../hooks";

export function UpdateBanner() {
  const { updateReady, update } = useServiceWorker();
  if (!updateReady) return null;
  return (
    <div className="fixed inset-x-0 top-4 z-50 mx-auto max-w-md px-4">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg">
        <div className="rounded-lg bg-primary/10 p-2">
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">New version available</p>
          <p className="text-xs text-muted-foreground">Refresh to get the latest.</p>
        </div>
        <Button size="sm" onClick={() => void update()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
