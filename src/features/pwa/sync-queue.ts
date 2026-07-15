/**
 * Background sync queue — architecture scaffold.
 * Queues actions in localStorage while offline and replays them when
 * connectivity returns. Consumers register handlers per action type.
 */
export interface QueuedAction<T = unknown> {
  id: string;
  type: string;
  payload: T;
  attempts: number;
  createdAt: number;
  lastError?: string;
}

const KEY = "zupix:pwa:sync-queue";
const MAX_ATTEMPTS = 5;

type Handler = (payload: unknown) => Promise<void>;
const handlers = new Map<string, Handler>();
const listeners = new Set<() => void>();

function read(): QueuedAction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as QueuedAction[];
  } catch {
    return [];
  }
}

function write(items: QueuedAction[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const syncQueue = {
  enqueue<T>(type: string, payload: T): QueuedAction<T> {
    const item: QueuedAction<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      attempts: 0,
      createdAt: Date.now(),
    };
    write([...read(), item as QueuedAction]);
    if (navigator.onLine) void syncQueue.flush();
    return item;
  },
  list(): QueuedAction[] {
    return read();
  },
  clear() {
    write([]);
  },
  registerHandler(type: string, handler: Handler) {
    handlers.set(type, handler);
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  async flush() {
    const items = read();
    const remaining: QueuedAction[] = [];
    for (const item of items) {
      const handler = handlers.get(item.type);
      if (!handler) {
        remaining.push(item);
        continue;
      }
      try {
        await handler(item.payload);
      } catch (e) {
        item.attempts += 1;
        item.lastError = e instanceof Error ? e.message : String(e);
        if (item.attempts < MAX_ATTEMPTS) remaining.push(item);
      }
    }
    write(remaining);
  },
};

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    void syncQueue.flush();
  });
}
