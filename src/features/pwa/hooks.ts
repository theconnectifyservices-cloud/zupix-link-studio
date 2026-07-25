import { useEffect, useState, useCallback } from "react";
import type { Workbox } from "workbox-window";
import { registerServiceWorker, applyUpdate } from "./register";

/** BeforeInstallPromptEvent — not in lib.dom types. */
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "zupix:pwa:install-dismissed";
const SNOOZE_KEY = "zupix:pwa:install-snooze";
const SNOOZE_MS = 1000 * 60 * 60 * 24 * 3; // 3 days

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    const snoozeUntil = Number(window.localStorage.getItem(SNOOZE_KEY) ?? 0);
    setSnoozed(snoozeUntil > Date.now());
    setIos(isIOS());
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).standalone === true;
    setInstalled(Boolean(standalone));

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  }, [deferred]);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  const snooze = useCallback(() => {
    window.localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    setSnoozed(true);
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(DISMISS_KEY);
    window.localStorage.removeItem(SNOOZE_KEY);
    setDismissed(false);
    setSnoozed(false);
  }, []);

  const canInstall =
    (Boolean(deferred) || ios) && !installed && !dismissed && !snoozed;

  return {
    canInstall,
    installed,
    dismissed,
    snoozed,
    isIOS: ios,
    hasNativePrompt: Boolean(deferred),
    promptInstall,
    dismiss,
    snooze,
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
