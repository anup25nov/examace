/**
 * Production Monitoring and Analytics
 * Centralized monitoring setup for production environment
 */

// Extend Window interface for Google Analytics
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

interface MonitoringConfig {
  analyticsId?: string;
  enablePerformanceMonitoring: boolean;
  enableAnalytics: boolean;
}

class ProductionMonitoring {
  private config: MonitoringConfig;
  private isInitialized = false;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize analytics
      if (this.config.enableAnalytics && this.config.analyticsId) {
        this.initializeAnalytics();
      }

      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      console.log('✅ Production monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize production monitoring:', error);
      throw error;
    }
  }

  private initializeAnalytics(): void {
    // Initialize Google Analytics or other analytics service
    if (typeof window !== 'undefined' && this.config.analyticsId) {
      // Example: Google Analytics 4
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.config.analyticsId}`;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', this.config.analyticsId, {
        page_title: document.title,
        page_location: window.location.href,
      });

      // Store gtag function globally for use throughout the app
      (window as any).gtag = gtag;

      console.log('✅ Analytics initialized');
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Global error handler for unhandled exceptions
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
      this.logErrorToAnalytics('javascript_error', {
        message: event.error?.message || 'Unknown error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logErrorToAnalytics('promise_rejection', {
        reason: event.reason?.toString() || 'Unknown rejection',
      });
    });
  }

  private logErrorToAnalytics(eventName: string, parameters: Record<string, any>): void {
    if (this.config.analyticsId && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  }

  // Public methods for manual error reporting
  reportError(error: Error, context?: any): void {
    console.error('Error reported:', error, context);
    this.logErrorToAnalytics('manual_error', {
      message: error.message,
      stack: error.stack,
      context: context,
    });
  }

  reportMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    console.log(`[${level.toUpperCase()}] ${message}`);
    this.logErrorToAnalytics('manual_message', {
      message,
      level,
    });
  }

  setUser(user: { id: string; email?: string; phone?: string }): void {
    console.log('User set:', user);
    
    if (this.config.analyticsId && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.config.analyticsId, {
        user_id: user.id,
        custom_map: {
          email: user.email,
          phone: user.phone,
        },
      });
    }
  }

  trackEvent(eventName: string, parameters?: Record<string, any>): void {
    console.log(`Event tracked: ${eventName}`, parameters);
    
    if (this.config.analyticsId && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, parameters);
    }
  }

  trackPageView(pagePath: string, pageTitle?: string): void {
    console.log(`Page view tracked: ${pagePath}`);
    
    if (this.config.analyticsId && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', this.config.analyticsId, {
        page_path: pagePath,
        page_title: pageTitle || document.title,
      });
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Factory function to create monitoring instance
export const createMonitoring = (config: Partial<MonitoringConfig> = {}): ProductionMonitoring => {
  const defaultConfig: MonitoringConfig = {
    enablePerformanceMonitoring: false,
    enableAnalytics: false,
    ...config,
  };

  return new ProductionMonitoring(defaultConfig);
};

// Default monitoring instance
let defaultMonitoring: ProductionMonitoring | null = null;

export const initMonitoring = async (config?: Partial<MonitoringConfig>): Promise<ProductionMonitoring> => {
  if (defaultMonitoring) {
    return defaultMonitoring;
  }

  const monitoringConfig: MonitoringConfig = {
    analyticsId: import.meta.env.VITE_ANALYTICS_ID,
    enablePerformanceMonitoring: false,
    enableAnalytics: !!import.meta.env.VITE_ANALYTICS_ID,
    ...config,
  };

  defaultMonitoring = new ProductionMonitoring(monitoringConfig);
  await defaultMonitoring.initialize();
  
  return defaultMonitoring;
};

export const getMonitoring = (): ProductionMonitoring | null => defaultMonitoring;

// Global error reporting functions for easy access
export const reportError = (error: Error, context?: any): void => {
  if (defaultMonitoring) {
    defaultMonitoring.reportError(error, context);
  } else {
    console.error('Monitoring not initialized:', error, context);
  }
};

export const reportMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
  if (defaultMonitoring) {
    defaultMonitoring.reportMessage(message, level);
  } else {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>): void => {
  if (defaultMonitoring) {
    defaultMonitoring.trackEvent(eventName, parameters);
  } else {
    console.log(`Event tracked: ${eventName}`, parameters);
  }
};

export const trackPageView = (pagePath: string, pageTitle?: string): void => {
  if (defaultMonitoring) {
    defaultMonitoring.trackPageView(pagePath, pageTitle);
  } else {
    console.log(`Page view tracked: ${pagePath}`);
  }
};

export const setUser = (user: { id: string; email?: string; phone?: string }): void => {
  if (defaultMonitoring) {
    defaultMonitoring.setUser(user);
  } else {
    console.log('User set:', user);
  }
};