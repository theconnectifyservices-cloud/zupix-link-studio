/**
 * Fetch wrapper with retry, timeout, and typed error handling.
 * Used by service modules; do not call fetch() directly outside of this file.
 */
import { AppError, normalizeError } from "./errors";

export interface RequestOptions extends RequestInit {
  retries?: number;
  timeoutMs?: number;
  baseUrl?: string;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new AppError("Request timed out", "TIMEOUT")), ms),
    ),
  ]);
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { retries = 1, timeoutMs = 15_000, baseUrl = "", ...init } = opts;
  const url = baseUrl + path;
  let attempt = 0;
  let lastErr: unknown;

  while (attempt <= retries) {
    try {
      const res = await withTimeout(
        fetch(url, {
          ...init,
          headers: {
            "content-type": "application/json",
            ...(init.headers ?? {}),
          },
        }),
        timeoutMs,
      );
      if (!res.ok) {
        const body = await res.text();
        throw new AppError(body || res.statusText, `HTTP_${res.status}`);
      }
      const ct = res.headers.get("content-type") ?? "";
      return (ct.includes("application/json") ? await res.json() : ((await res.text()) as unknown)) as T;
    } catch (e) {
      lastErr = e;
      attempt++;
      if (attempt > retries) break;
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
  throw normalizeError(lastErr);
}
