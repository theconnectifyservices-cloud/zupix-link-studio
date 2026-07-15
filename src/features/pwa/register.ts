/**
 * Guarded service-worker registration wrapper.
 * Registers /sw.js only in production, on the live domain, outside iframes,
 * and never in Lovable preview/dev contexts. Supports ?sw=off kill switch.
 */
import type { Workbox } from "workbox-window";

const SW_URL = "/sw.js";

export interface PwaRegistration {
  wb: Workbox | null;
  registration: ServiceWorkerRegistration | null;
}

function shouldSkip(): boolean {
  if (typeof window === "undefined") return true;
  if (!("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(SW_URL)) {
        await r.unregister();
      }
    }
  } catch {
    /* ignore */
  }
}

let cached: PwaRegistration | null = null;

export async function registerServiceWorker(
  onUpdate?: (wb: Workbox) => void,
): Promise<PwaRegistration> {
  if (shouldSkip()) {
    await unregisterMatching();
    return { wb: null, registration: null };
  }
  if (cached) return cached;

  const { Workbox } = await import("workbox-window");
  const wb = new Workbox(SW_URL);

  wb.addEventListener("waiting", () => onUpdate?.(wb));
  wb.addEventListener("externalwaiting", () => onUpdate?.(wb));

  const registration = (await wb.register()) ?? null;
  cached = { wb, registration };
  return cached;
}

export async function applyUpdate(wb: Workbox) {
  wb.addEventListener("controlling", () => {
    window.location.reload();
  });
  await wb.messageSkipWaiting();
}
