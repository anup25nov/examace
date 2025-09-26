/**
 * Comprehensive Caching Service for Images, Icons, and Static Data
 * Optimized for low network connectivity users
 */

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  type: 'image' | 'data' | 'api';
}

class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem>();
  private imageCache = new Map<string, string>(); // URL -> Blob URL
  private readonly DEFAULT_EXPIRY = {
    image: 7 * 24 * 60 * 60 * 1000, // 7 days
    data: 24 * 60 * 60 * 1000, // 1 day
    api: 5 * 60 * 1000 // 5 minutes
  };

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Cache an image and return a blob URL
   */
  async cacheImage(url: string, forceRefresh = false): Promise<string> {
    const cacheKey = `img_${url}`;
    
      // Check if already cached and not expired
      if (!forceRefresh && this.imageCache.has(url)) {
        const cachedUrl = this.imageCache.get(url);
        if (cachedUrl && this.isImageUrlValid(cachedUrl)) {
          return cachedUrl;
        }
      }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Store in cache
      this.imageCache.set(url, blobUrl);
      this.cache.set(cacheKey, {
        data: blobUrl,
        timestamp: Date.now(),
        expiry: this.DEFAULT_EXPIRY.image,
        type: 'image'
      });

      // Store in localStorage for persistence
      this.persistToStorage(cacheKey, blobUrl, 'image');
      
      return blobUrl;
    } catch (error) {
      return url; // Fallback to original URL
    }
  }

  /**
   * Cache static data (JSON, text, etc.)
   */
  async cacheData<T>(key: string, data: T, expiry?: number): Promise<void> {
    const cacheKey = `data_${key}`;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.DEFAULT_EXPIRY.data,
      type: 'data'
    };

    this.cache.set(cacheKey, item);
    this.persistToStorage(cacheKey, data, 'data');
  }

  /**
   * Get cached data
   */
  getCachedData<T>(key: string): T | null {
    const cacheKey = `data_${key}`;
    const item = this.cache.get(cacheKey) as CacheItem<T>;
    
    if (!item) {
      // Try to load from localStorage
      const stored = this.loadFromStorage(cacheKey);
      if (stored) {
        this.cache.set(cacheKey, stored);
        return stored.data;
      }
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(cacheKey);
      localStorage.removeItem(cacheKey);
      return null;
    }

    return item.data;
  }

  /**
   * Cache API response
   */
  async cacheApiResponse<T>(endpoint: string, data: T, expiry?: number): Promise<void> {
    const cacheKey = `api_${endpoint}`;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiry || this.DEFAULT_EXPIRY.api,
      type: 'api'
    };

    this.cache.set(cacheKey, item);
    this.persistToStorage(cacheKey, data, 'api');
  }

  /**
   * Get cached API response
   */
  getCachedApiResponse<T>(endpoint: string): T | null {
    const cacheKey = `api_${endpoint}`;
    const item = this.cache.get(cacheKey) as CacheItem<T>;
    
    if (!item) {
      const stored = this.loadFromStorage(cacheKey);
      if (stored) {
        this.cache.set(cacheKey, stored);
        return stored.data;
      }
      return null;
    }

    if (this.isExpired(item)) {
      this.cache.delete(cacheKey);
      localStorage.removeItem(cacheKey);
      return null;
    }

    return item.data;
  }

  /**
   * Preload critical images
   */
  async preloadCriticalImages(): Promise<void> {
    const criticalImages = [
      '/logos/logo.jpeg',
      '/logos/alternate_image.png',
      '/logos/examace-logo.svg',
      '/logos/ssc-cgl-logo.svg',
      '/logos/india-map.svg',
      '/logos/math-addition.svg',
      '/logos/math-problem.svg',
      '/logos/math-problem.png'
    ];

    const preloadPromises = criticalImages.map(url => 
      this.cacheImage(url).catch(() => {})
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Cache exam data
   */
  async cacheExamData(examId: string, data: any): Promise<void> {
    const key = `exam_${examId}`;
    await this.cacheData(key, data, 30 * 60 * 1000); // 30 minutes
  }

  /**
   * Get cached exam data
   */
  getCachedExamData(examId: string): any | null {
    const key = `exam_${examId}`;
    return this.getCachedData(key);
  }

  /**
   * Clear expired cache
   */
  clearExpiredCache(): void {
    const now = Date.now();
    let cleared = 0;

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        localStorage.removeItem(key);
        cleared++;
      }
    }

  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.imageCache.clear();
    
    // Clear localStorage cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });

  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { total: number; images: number; data: number; api: number } {
    const stats = { total: 0, images: 0, data: 0, api: 0 };
    
    for (const item of this.cache.values()) {
      stats.total++;
      stats[item.type]++;
    }

    return stats;
  }

  // Private methods
  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.expiry;
  }

  private isImageUrlValid(url: string): boolean {
    try {
      return url.startsWith('blob:') && URL.createObjectURL !== undefined;
    } catch {
      return false;
    }
  }

  private persistToStorage(key: string, data: any, type: string): void {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        expiry: this.DEFAULT_EXPIRY[type as keyof typeof this.DEFAULT_EXPIRY],
        type
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      // Silently fail if localStorage is not available
    }
  }

  private loadFromStorage(key: string): CacheItem | null {
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (!stored) return null;
      
      const item = JSON.parse(stored) as CacheItem;
      if (this.isExpired(item)) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return item;
    } catch (error) {
      return null;
    }
  }
}

export const cacheService = CacheService.getInstance();
export default cacheService;
