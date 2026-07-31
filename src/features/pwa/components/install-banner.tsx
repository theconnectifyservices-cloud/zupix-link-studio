import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "../hooks";

/**
 * Floating install prompt.
 * - Android/Chromium: native `beforeinstallprompt` flow with an Install Now button.
 * - iOS Safari: instructions only (no install button — the API does not exist).
 * - Never rendered once installed or while a dismissal is inside its 7-day window.
 */
export function InstallBanner() {
  const { canInstall, promptInstall, dismiss, isIOS, hasNativePrompt } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!canInstall) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [canInstall]);

  if (!canInstall) return null;

  /** Hide instantly, persist the 7-day dismissal after the fade-out. */
  function close() {
    setClosing(true);
    setVisible(false);
    setTimeout(dismiss, 220);
  }

  async function handleInstall() {
    if (!hasNativePrompt) return;
    setInstalling(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast.success("ZUPIX Link Studio installed successfully.");
        setVisible(false);
      } else {
        close();
      }
    } finally {
      setInstalling(false);
    }
  }

  const showInstallButton = hasNativePrompt && !isIOS;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[60] mx-auto max-w-md px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] transition-all duration-300 ease-out sm:pb-6 ${
        visible && !closing ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
      role="dialog"
      aria-label="Install ZUPIX Link Studio"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

        <button
          type="button"
          aria-label="Close install prompt"
          onClick={close}
          className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-3 pr-9">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg">
            <Download className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Install ZUPIX Link Studio</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {showInstallButton
                ? "Install the app for a faster and native experience."
                : "Add ZUPIX to your Home Screen for a faster and native experience."}
            </p>

            {showInstallButton ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => void handleInstall()} disabled={installing}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {installing ? "Installing…" : "Install Now"}
                </Button>
                <Button size="sm" variant="ghost" onClick={close}>
                  Maybe Later
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <span>Tap</span>
                  <Share className="h-4 w-4 text-primary" />
                  <span>Share</span>
                  <span aria-hidden>→</span>
                  <PlusSquare className="h-4 w-4 text-primary" />
                  <span>Add to Home Screen</span>
                </div>
                <Button size="sm" variant="ghost" className="mt-2" onClick={close}>
                  Maybe Later
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
