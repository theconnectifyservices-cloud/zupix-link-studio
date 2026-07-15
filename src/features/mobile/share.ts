/**
 * Web Share API wrapper with clipboard fallback.
 */
export interface SharePayload {
  title?: string;
  text?: string;
  url: string;
  files?: File[];
}

export interface ShareResult {
  method: "native" | "clipboard" | "unsupported";
  ok: boolean;
  error?: string;
}

export function canNativeShare(payload?: SharePayload): boolean {
  if (typeof navigator === "undefined" || !("share" in navigator)) return false;
  if (payload?.files && payload.files.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cs = (navigator as any).canShare;
    return typeof cs === "function" ? cs.call(navigator, { files: payload.files }) : false;
  }
  return true;
}

export async function shareOrCopy(payload: SharePayload): Promise<ShareResult> {
  if (canNativeShare(payload)) {
    try {
      await navigator.share(payload);
      return { method: "native", ok: true };
    } catch (e) {
      const err = e as DOMException;
      if (err.name === "AbortError") return { method: "native", ok: false, error: "cancelled" };
      // fall through to clipboard
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(payload.url);
      return { method: "clipboard", ok: true };
    } catch (e) {
      return { method: "clipboard", ok: false, error: (e as Error).message };
    }
  }
  return { method: "unsupported", ok: false };
}
