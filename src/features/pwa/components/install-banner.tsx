import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "../hooks";

export function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto max-w-md px-4">
      <div className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-lg">
        <div className="rounded-lg bg-primary/10 p-2">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install ZUPIX</p>
          <p className="truncate text-xs text-muted-foreground">
            Get the app experience — offline access and faster loads.
          </p>
        </div>
        <Button size="sm" onClick={() => void promptInstall()}>
          Install
        </Button>
        <Button size="icon" variant="ghost" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
