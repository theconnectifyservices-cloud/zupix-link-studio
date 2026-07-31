import { useEffect, useState, useCallback } from "react";
import type { Workbox } from "workbox-window";
import { registerServiceWorker, applyUpdate } from "./register";

/** BeforeInstallPromptEvent — not in lib.dom types. */
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Dismissal is remembered for 7 days (value = expiry timestamp in ms). */
const DISMISS_KEY = "pwa-install-dismissed";
const LEGACY_KEYS = ["zupix:pwa:install-dismissed", "zupix:pwa:install-snooze"];
const DISMISS_MS = 1000 * 60 * 60 * 24 * 7;

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return (/iPad|iPhone|iPod/.test(ua) && !("MSStream" in window)) || iPadOS;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return Boolean(
    window.matchMedia?.("(display-mode: standalone)").matches ||
      window.matchMedia?.("(display-mode: fullscreen)").matches ||
      window.matchMedia?.("(display-mode: minimal-ui)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true,
  );
}

/** True while a stored dismissal is still inside its 7-day window. */
function dismissActive() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const until = Number(raw);
  // Legacy/boolean values ("true"/"1") are treated as a fresh 7-day window.
  if (!Number.isFinite(until) || until <= 0) {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    return true;
  }
  if (until > Date.now()) return true;
  window.localStorage.removeItem(DISMISS_KEY);
  return false;
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // pessimistic until checked client-side
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
    setDismissed(dismissActive());
    setIos(isIOS());
    setInstalled(isStandalone());

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onDisplayChange = () => setInstalled(isStandalone());
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    mq?.addEventListener?.("change", onDisplayChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
      mq?.removeEventListener?.("change", onDisplayChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      // A deferred prompt can only be used once.
      setDeferred(null);
      return outcome;
    } catch {
      setDeferred(null);
      return "dismissed" as const;
    }
  }, [deferred]);

  /** Hide the banner and keep it hidden for 7 days. */
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      /* storage unavailable — session-only dismissal */
    }
    setDismissed(true);
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(DISMISS_KEY);
      LEGACY_KEYS.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setDismissed(false);
  }, []);

  const hasNativePrompt = Boolean(deferred);
  // Show only with a real install path: native prompt, or the iOS Safari fallback.
  const canInstall = (hasNativePrompt || ios) && !installed && !dismissed;

  return {
    canInstall,
    installed,
    dismissed,
    isIOS: ios,
    hasNativePrompt,
    promptInstall,
    dismiss,
    /** Kept for API compatibility — same 7-day dismissal. */
    snooze: dismiss,
    reset,
  };
}



export function useServiceWorker() {
  const [wb, setWb] = useState<Workbox | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void registerServiceWorker((waitingWb) => {
      if (!mounted) return;
      setUpdateReady(true);
      setWb(waitingWb);
    }).then((r) => {
      if (mounted && r.wb) setWb(r.wb);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback(async () => {
    if (!wb) return;
    await applyUpdate(wb);
  }, [wb]);

  return { updateReady, update };
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

export interface StorageInfo {
  usage: number;
  quota: number;
  percent: number;
  caches: { name: string; entries: number }[];
}

export function useStorageInfo() {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof navigator === "undefined" || !("caches" in window)) return;
    setLoading(true);
    try {
      const est = (await navigator.storage?.estimate?.()) ?? { usage: 0, quota: 0 };
      const names = await caches.keys();
      const cacheDetails = await Promise.all(
        names.map(async (name) => {
          const c = await caches.open(name);
          const keys = await c.keys();
          return { name, entries: keys.length };
        }),
      );
      setInfo({
        usage: est.usage ?? 0,
        quota: est.quota ?? 0,
        percent: est.quota ? ((est.usage ?? 0) / est.quota) * 100 : 0,
        caches: cacheDetails,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
    await refresh();
  }, [refresh]);

  const clearOne = useCallback(
    async (name: string) => {
      await caches.delete(name);
      await refresh();
    },
    [refresh],
  );

  return { info, loading, refresh, clearAll, clearOne };
}
