/**
 * Applies a pending app update: activates a waiting service worker when one
 * exists, drops stale caches, then reloads onto the newest build.
 * Safe to call in dev / preview where no service worker is registered.
 */
export async function applyAppUpdate(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
        await reg.update().catch(() => undefined);
      }
    }
  } catch {
    /* non-fatal — fall through to reload */
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => /precache|html/i.test(k)).map((k) => caches.delete(k)));
    }
  } catch {
    /* non-fatal */
  }

  window.location.reload();
}
