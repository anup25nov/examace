// Navigation performance optimization utilities

import { examConfigs } from '@/config/examConfig';

// Prefetch routes for better navigation performance
export const prefetchRoutes = () => {
  try {
    const routes = [
      '/',
      '/auth',
      ...Object.keys(examConfigs).map(examId => `/exam/${examId}`)
    ];

    routes.forEach(route => {
      // Prefetch the route
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  } catch (error) {
    console.warn('Route prefetching failed:', error);
  }
};

// Cache navigation data
const navigationCache = new Map<string, any>();

export const cacheNavigationData = (key: string, data: any) => {
  navigationCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const getCachedNavigationData = (key: string, maxAge: number = 5 * 60 * 1000) => {
  const cached = navigationCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < maxAge) {
    return cached.data;
  }
  return null;
};

// Optimize route transitions
export const optimizeRouteTransition = (fromRoute: string, toRoute: string) => {
  // Preload critical data for the destination route
  if (toRoute.startsWith('/exam/')) {
    const examId = toRoute.split('/')[2];
    const exam = examConfigs[examId];
    if (exam) {
      // Cache exam data
      cacheNavigationData(`exam-${examId}`, exam);
    }
  }
};

// Debounced navigation to prevent rapid route changes
let navigationTimeout: NodeJS.Timeout | null = null;

export const debouncedNavigate = (navigate: (path: string) => void, path: string, delay: number = 100) => {
  if (navigationTimeout) {
    clearTimeout(navigationTimeout);
  }
  
  navigationTimeout = setTimeout(() => {
    navigate(path);
  }, delay);
};

// Preload components for better performance
export const preloadComponents = () => {
  // For Vite, we'll use dynamic imports to preload components
  // This is safer than trying to preload with link tags
  try {
    // Preload critical components
    import('@/pages/ExamDashboard');
    import('@/pages/TestInterface');
    import('@/pages/ResultAnalysis');
    import('@/components/SolutionsDisplay');
  } catch (error) {
    console.warn('Component preloading failed:', error);
  }
};

// Initialize navigation optimizations
export const initNavigationOptimizations = () => {
  // Prefetch routes
  prefetchRoutes();
  
  // Preload components
  preloadComponents();
  
  console.log('Navigation optimizations initialized');
};
