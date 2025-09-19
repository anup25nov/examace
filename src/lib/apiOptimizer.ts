/**
 * API Call Optimizer - Reduces redundant API calls through caching and deduplication
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class APIOptimizer {
  private static instance: APIOptimizer;
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<any>>();

  static getInstance(): APIOptimizer {
    if (!APIOptimizer.instance) {
      APIOptimizer.instance = new APIOptimizer();
    }
    return APIOptimizer.instance;
  }

  /**
   * Execute API call with caching and deduplication
   */
  async execute<T>(
    key: string,
    apiCall: () => Promise<T>,
    options: {
      ttl?: number; // Time to live in milliseconds
      useCache?: boolean;
      deduplicate?: boolean;
    } = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, useCache = true, deduplicate = true } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache<T>(key);
      if (cached !== null) {
        return cached;
      }
    }

    // Check for pending requests (deduplication)
    if (deduplicate && this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Execute API call
    const requestPromise = apiCall()
      .then((result) => {
        // Cache the result
        if (useCache) {
          this.setCache(key, result, ttl);
        }
        // Remove from pending
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(key);
        throw error;
      });

    // Store pending request
    if (deduplicate) {
      this.pendingRequests.set(key, requestPromise);
    }

    return requestPromise;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear cache for specific key or all cache
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const apiOptimizer = APIOptimizer.getInstance();
