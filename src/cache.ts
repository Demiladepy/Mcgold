type CacheEntry<T> = { value: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Read a cached value if present and not expired.
 */
export function getCached<T>(key: string): T | undefined {
  const row = store.get(key);
  if (!row) return undefined;
  if (Date.now() >= row.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return row.value as T;
}

/**
 * Store a value with TTL (default 5 minutes).
 */
export function setCached<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}
