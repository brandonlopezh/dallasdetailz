/**
 * Tiny in-memory cache with a time limit. Lives per Worker instance, so it
 * only saves repeat lookups made close together (which is the common case:
 * one visitor loading the page, then the booking popup, then the time list).
 * Only finished values are stored, never in-flight promises, because a
 * promise started by one request must not be awaited by another on Workers.
 */
const store = new Map<string, { at: number; value: unknown }>();

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const value = await load();
  store.set(key, { at: Date.now(), value });
  return value;
}

/** Drop a cached value so the next read is fresh (e.g. right after an edit). */
export function forget(key: string): void {
  store.delete(key);
}
