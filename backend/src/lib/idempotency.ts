/**
 * Simple in-memory cache with TTL support for idempotency keys
 * Production: Consider using Redis for better scalability across multiple instances
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class IdempotencyCache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTtlMs = 3600_000; // 1 hour
  private readonly maxEntries = 10000; // Prevent unbounded growth
  private cleanupInterval?: NodeJS.Timeout;

  set<T>(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    
    // Clean up expired entries before adding new ones
    this._cleanupExpired();
    
    // Enforce max size limit - remove oldest entries if needed
    if (this.store.size >= this.maxEntries) {
      const now = Date.now();
      const sorted = Array.from(this.store.entries())
        .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      
      // Keep only the newest 80% to avoid immediate evictions
      const keepCount = Math.floor(this.maxEntries * 0.8);
      const toRemove = sorted.slice(0, sorted.length - keepCount);
      toRemove.forEach(([k]) => this.store.delete(k));
    }
    
    this.store.set(key, { value, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  size(): number {
    this._cleanupExpired();
    return this.store.size;
  }

  private _cleanupExpired(): void {
    const now = Date.now();
    let hasExpired = false;
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        hasExpired = true;
      }
    }
    
    if (hasExpired) {
      // Schedule next cleanup in 5 minutes instead of busy-waiting
      if (!this.cleanupInterval) {
        this.cleanupInterval = setTimeout(() => {
          this.cleanupInterval = undefined;
        }, 300_000);
      }
    }
  }

  clear(): void {
    this.store.clear();
    if (this.cleanupInterval) {
      clearTimeout(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  // For monitoring/debugging
  stats(): { total: number; expired: number } {
    const now = Date.now();
    const expired = Array.from(this.store.values()).filter(e => now > e.expiresAt).length;
    return { 
      total: this.store.size - expired, 
      expired 
    };
  }
}

// Singleton instance
export const idempotencyCache = new IdempotencyCache();
