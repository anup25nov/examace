/**
 * Image Caching Service
 * Provides efficient image loading and caching for better performance
 */

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  size: number;
}

interface ImageCacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxAge: number; // Maximum age in milliseconds
  maxEntries: number; // Maximum number of entries
}

export class ImageCacheService {
  private static instance: ImageCacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private config: ImageCacheConfig;

  private constructor() {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 100
    };
  }

  public static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  /**
   * Load and cache an image
   */
  async loadImage(url: string, options?: {
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
  }): Promise<string> {
    try {
      // Check if image is already cached
      const cached = this.getCachedImage(url);
      if (cached) {
        return cached;
      }

      // Load image with timeout
      const timeout = options?.timeout || 10000; // 10 seconds default
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        // Cache the image
        this.cacheImage(url, blob);

        return objectUrl;

      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }

    } catch (error) {
      console.error('Error loading image:', error);
      // Return original URL as fallback
      return url;
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[], options?: {
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
  }): Promise<{ success: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      urls.map(url => this.loadImage(url, options))
    );

    const success: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        success.push(urls[index]);
      } else {
        failed.push(urls[index]);
      }
    });

    return { success, failed };
  }

  /**
   * Get cached image URL
   */
  private getCachedImage(url: string): string | null {
    const entry = this.cache.get(url);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.config.maxAge) {
      this.cache.delete(url);
      return null;
    }

    return entry.url;
  }

  /**
   * Cache an image
   */
  private cacheImage(url: string, blob: Blob): void {
    // Check cache size and clean if necessary
    this.cleanCache();

    // Check if we can fit this image
    if (blob.size > this.config.maxSize) {
      console.warn('Image too large to cache:', url, blob.size);
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const entry: CacheEntry = {
      url: objectUrl,
      blob,
      timestamp: Date.now(),
      size: blob.size
    };

    this.cache.set(url, entry);
  }

  /**
   * Clean cache based on size and age
   */
  private cleanCache(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());

    // Remove expired entries
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > this.config.maxAge) {
        URL.revokeObjectURL(entry.url);
        this.cache.delete(key);
      }
    });

    // If still over limit, remove oldest entries
    if (this.cache.size > this.config.maxEntries) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = sortedEntries.slice(0, this.cache.size - this.config.maxEntries);
      toRemove.forEach(([key, entry]) => {
        URL.revokeObjectURL(entry.url);
        this.cache.delete(key);
      });
    }

    // Check total size
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    if (totalSize > this.config.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      let currentSize = totalSize;
      for (const [key, entry] of sortedEntries) {
        if (currentSize <= this.config.maxSize) break;
        
        URL.revokeObjectURL(entry.url);
        this.cache.delete(key);
        currentSize -= entry.size;
      }
    }
  }

  /**
   * Clear all cached images
   */
  clearCache(): void {
    for (const entry of this.cache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: number;
    totalSize: number;
  } {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }

    return {
      size: this.cache.size,
      entries: this.cache.size,
      totalSize
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<ImageCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export const imageCacheService = ImageCacheService.getInstance();

/**
 * React hook for image loading with cache
 */
export function useImageCache() {
  const loadImage = async (url: string, options?: {
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
  }) => {
    return await imageCacheService.loadImage(url, options);
  };

  const preloadImages = async (urls: string[], options?: {
    priority?: 'high' | 'normal' | 'low';
    timeout?: number;
  }) => {
    return await imageCacheService.preloadImages(urls, options);
  };

  const clearCache = () => {
    imageCacheService.clearCache();
  };

  const getStats = () => {
    return imageCacheService.getCacheStats();
  };

  return {
    loadImage,
    preloadImages,
    clearCache,
    getStats
  };
}
