/** Best-effort browser-side resource introspection. */
export interface ResourceSnapshot {
  memoryUsedMb: number | null;
  memoryLimitMb: number | null;
  storageUsedMb: number | null;
  storageQuotaMb: number | null;
  bandwidthMbps: number | null;
  effectiveType: string | null;
  cacheEntries: number | null;
}

export async function readResources(): Promise<ResourceSnapshot> {
  const perfMem = (performance as unknown as { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
  const conn = (navigator as unknown as { connection?: { downlink?: number; effectiveType?: string } }).connection;

  let storageUsedMb: number | null = null;
  let storageQuotaMb: number | null = null;
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      storageUsedMb = est.usage ? est.usage / (1024 * 1024) : null;
      storageQuotaMb = est.quota ? est.quota / (1024 * 1024) : null;
    }
  } catch {
    /* noop */
  }

  let cacheEntries: number | null = null;
  try {
    if ("caches" in window) {
      const names = await caches.keys();
      let count = 0;
      for (const n of names) {
        const c = await caches.open(n);
        count += (await c.keys()).length;
      }
      cacheEntries = count;
    }
  } catch {
    /* noop */
  }

  return {
    memoryUsedMb: perfMem ? perfMem.usedJSHeapSize / (1024 * 1024) : null,
    memoryLimitMb: perfMem ? perfMem.jsHeapSizeLimit / (1024 * 1024) : null,
    storageUsedMb,
    storageQuotaMb,
    bandwidthMbps: conn?.downlink ?? null,
    effectiveType: conn?.effectiveType ?? null,
    cacheEntries,
  };
}
