/**
 * Production Monitoring
 * Centralized monitoring setup for production environment
 */

interface MonitoringConfig {
  enablePerformanceMonitoring: boolean;
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
      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      this.isInitialized = true;
      console.log('✅ Production monitoring initialized');
    } catch (error) {
      console.error('❌ Failed to initialize production monitoring:', error);
      throw error;
    }
  }


  private setupGlobalErrorHandlers(): void {
    // Global error handler for unhandled exceptions
    window.addEventListener('error', (event) => {
      console.error('Unhandled error:', event.error);
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }

  // Public methods for manual error reporting
  reportError(error: Error, context?: any): void {
    console.error('Error reported:', error, context);
  }

  reportMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Factory function to create monitoring instance
export const createMonitoring = (config: Partial<MonitoringConfig> = {}): ProductionMonitoring => {
  const defaultConfig: MonitoringConfig = {
    enablePerformanceMonitoring: false,
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
    enablePerformanceMonitoring: false,
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
