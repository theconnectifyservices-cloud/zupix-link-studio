/**
 * Reliability primitives: retry with backoff + circuit breaker.
 * Pure utilities usable from client or server.
 */

export interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  onAttempt?: (attempt: number, err: unknown) => void;
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 3, minDelayMs = 200, maxDelayMs = 4000, factor = 2, onAttempt } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      onAttempt?.(attempt, err);
      if (attempt === retries) break;
      const delay = Math.min(maxDelayMs, minDelayMs * Math.pow(factor, attempt));
      const jitter = delay * (0.5 + Math.random() * 0.5);
      await new Promise((r) => setTimeout(r, jitter));
    }
  }
  throw lastErr;
}

export type BreakerState = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private failures = 0;
  private openedAt = 0;
  private state: BreakerState = "closed";
  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 30_000,
  ) {}
  getState(): BreakerState {
    if (this.state === "open" && Date.now() - this.openedAt >= this.cooldownMs) {
      this.state = "half-open";
    }
    return this.state;
  }
  async exec<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.getState();
    if (state === "open") throw new Error("Circuit open");
    try {
      const result = await fn();
      this.failures = 0;
      this.state = "closed";
      return result;
    } catch (err) {
      this.failures += 1;
      if (this.failures >= this.threshold) {
        this.state = "open";
        this.openedAt = Date.now();
      }
      throw err;
    }
  }
  reset() {
    this.failures = 0;
    this.state = "closed";
  }
}
