interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface TtlCache<T> {
  get: (key: string) => T | undefined;
  set: (key: string, value: T) => void;
}

/**
 * Minimal in-memory cache with per-entry expiry. Entries are swept lazily
 * (on write, once the cache is full) rather than on a timer, which is
 * sufficient for the small, short-lived key sets this app produces.
 */
export function createTtlCache<T>(ttlMs: number, maxEntries = 100): TtlCache<T> {
  const store = new Map<string, CacheEntry<T>>();

  function sweepExpired(now: number) {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) store.delete(key);
    }
  }

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      const now = Date.now();
      if (store.size >= maxEntries) sweepExpired(now);
      store.set(key, { value, expiresAt: now + ttlMs });
    },
  };
}
