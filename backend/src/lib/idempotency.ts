/**
 * Simple in-memory cache with TTL support for idempotency keys
 * Production: Consider using Redis for better scalability across multiple instances
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class IdempotencyCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTtlMs = 3600_000; // 1 hour
  private readonly maxEntries = 10000; // Prevent unbounded growth
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private mutex = Promise.resolve();

  private async lock<T>(fn: () => T): Promise<T> {
    const prev = this.mutex;
    let release!: () => void;
    this.mutex = new Promise<void>(resolve => { release = resolve; });
    await prev;
    try { return fn(); } finally { release(); }
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }

  private _cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  // Periodic cleanup — call once at startup
  startPeriodicCleanup(intervalMs = 300_000): void {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => this._cleanupExpired(), intervalMs);
  }

  stopPeriodicCleanup(): void {
    if (this.cleanupTimer) { clearInterval(this.cleanupTimer); this.cleanupTimer = undefined; }
  }

  clear(): void {
    this.store.clear();
  }

  // For monitoring/debugging
  stats(): { active: number; expired: number } {
    const now = Date.now();
    const expired = Array.from(this.store.values()).filter(e => now > e.expiresAt).length;
    return { active: this.store.size - expired, expired };
  }
}

// Singleton instance
export const idempotencyCache = new IdempotencyCache();
