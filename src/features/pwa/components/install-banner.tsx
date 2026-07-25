import { useEffect, useState } from "react";
import { Download, X, Share, PlusSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "../hooks";

export function InstallBanner() {
  const { canInstall, promptInstall, dismiss, snooze, isIOS, hasNativePrompt } =
    useInstallPrompt();
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!canInstall) return;
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, [canInstall]);

  if (!canInstall && !success) return null;

  const close = (fn: () => void) => {
    setLeaving(true);
    setTimeout(fn, 240);
  };

  async function handleInstall() {
    if (isIOS && !hasNativePrompt) return; // iOS shows instructions only
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2200);
    }
  }

  if (success) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] mx-auto flex max-w-md justify-center px-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 shadow-2xl backdrop-blur-xl animate-scale-in">
          <Sparkles className="h-4 w-4" />
          Installing ZUPIX…
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-4 z-[60] mx-auto max-w-md px-4 sm:bottom-6 ${
        mounted && !leaving ? "animate-fade-in" : "opacity-0 translate-y-4"
      } ${leaving ? "translate-y-4 opacity-0" : ""} transition-all duration-300`}
      role="dialog"
      aria-label="Install ZUPIX Link Studio"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_-15px_rgba(255,90,60,0.35)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-pink-500/10" />
        <button
          aria-label="Close"
          onClick={() => close(dismiss)}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-start gap-3 pr-8">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 text-lg font-bold text-white shadow-lg shadow-orange-500/30">
            <Download className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Install ZUPIX Link Studio
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {isIOS && !hasNativePrompt
                ? "Tap Share, then Add to Home Screen for a native-like experience."
                : "Install the app for a faster, native-like experience."}
            </p>

            {isIOS && !hasNativePrompt ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground">
                <Share className="h-4 w-4 text-primary" />
                <span>Then</span>
                <PlusSquare className="h-4 w-4 text-primary" />
                <span>Add to Home Screen</span>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => close(snooze)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Later
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
