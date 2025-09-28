// Performance optimization utilities

// Preload critical resources
export const preloadCriticalResources = () => {
  try {
    // Preload Supabase SDK
    const supabaseScript = document.createElement('link');
    supabaseScript.rel = 'preload';
    supabaseScript.href = 'https://unpkg.com/@supabase/supabase-js@2';
    supabaseScript.as = 'script';
    document.head.appendChild(supabaseScript);
  } catch (error) {
    console.warn('Resource preloading failed:', error);
  }
};

// Image optimization
export const optimizeImages = () => {
  // Add loading="lazy" to all images
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
  });
};

// Debounce function for search and input
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Cache management
export const cacheManager = {
  // Set cache with expiration
  set: (key: string, value: any, expirationMinutes: number = 60) => {
    const item = {
      value,
      timestamp: Date.now(),
      expiration: expirationMinutes * 60 * 1000
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  // Get cache with expiration check
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (now - parsed.timestamp > parsed.expiration) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      localStorage.removeItem(key);
      return null;
    }
  },

  // Clear expired cache
  clearExpired: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        cacheManager.get(key); // This will remove expired items
      }
    });
  }
};

// Bundle size optimization
export const bundleOptimizer = {
  // Load components on demand
  loadComponent: async (componentPath: string) => {
    try {
      const module = await import(/* @vite-ignore */ componentPath);
      return module.default;
    } catch (error) {
      console.error(`Failed to load component: ${componentPath}`, error);
      return null;
    }
  },

  // Prefetch next likely components
  prefetchComponents: (components: string[]) => {
    components.forEach(component => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = component;
      document.head.appendChild(link);
    });
  }
};

// Memory management
export const memoryManager = {
  // Clear unused data
  cleanup: () => {
    // Clear expired cache
    cacheManager.clearExpired();
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  },

  // Monitor memory usage
  getMemoryUsage: () => {
    if ('memory' in performance) {
      return {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Preload critical resources
  preloadCriticalResources();

  // Optimize images
  optimizeImages();

  // Clean up memory periodically
  setInterval(memoryManager.cleanup, 5 * 60 * 1000); // Every 5 minutes

  // Clear expired cache on page load
  cacheManager.clearExpired();

  console.log('Performance optimizations initialized');
};
