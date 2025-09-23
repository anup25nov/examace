import { errorHandlingService } from './errorHandlingService';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowestOperations: Array<{ name: string; time: number }>;
  recentMetrics: PerformanceMetric[];
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private slowThreshold = 2000; // 2 seconds

  public static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Start performance monitoring for an operation
   */
  startTiming(operationName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      this.recordMetric({
        name: operationName,
        value: duration,
        unit: 'ms',
        timestamp: new Date()
      });

      // Log slow operations
      if (duration > this.slowThreshold) {
        console.warn(`🐌 Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
        errorHandlingService.handleError(new Error(`Slow operation: ${operationName}`), {
          action: 'performance_warning',
          resource: 'performance_monitoring'
        });
      }
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log critical performance issues
    if (metric.value > this.slowThreshold * 2) {
      console.error(`🚨 Critical performance issue: ${metric.name} took ${metric.value}${metric.unit}`);
    }
  }

  /**
   * Monitor API call performance
   */
  async monitorApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const endTiming = this.startTiming(`api_${apiName}`);
    
    try {
      const result = await apiCall();
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      
      // Record error metric
      this.recordMetric({
        name: `api_${apiName}_error`,
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        context: { ...context, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  /**
   * Monitor component render performance
   */
  monitorComponentRender(componentName: string, renderFn: () => void): void {
    const endTiming = this.startTiming(`component_${componentName}_render`);
    renderFn();
    endTiming();
  }

  /**
   * Monitor database query performance
   */
  async monitorDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const endTiming = this.startTiming(`db_${queryName}`);
    
    try {
      const result = await queryFn();
      endTiming();
      return result;
    } catch (error) {
      endTiming();
      
      // Record error metric
      this.recordMetric({
        name: `db_${queryName}_error`,
        value: 1,
        unit: 'count',
        timestamp: new Date(),
        context: { ...context, error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      throw error;
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Filter recent metrics
    const recentMetrics = this.metrics.filter(
      metric => metric.timestamp.getTime() > oneHourAgo
    );

    // Calculate statistics
    const totalRequests = recentMetrics.length;
    const averageResponseTime = totalRequests > 0 
      ? recentMetrics.reduce((sum, metric) => sum + metric.value, 0) / totalRequests
      : 0;

    const errorCount = recentMetrics.filter(metric => 
      metric.name.includes('_error')
    ).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Get slowest operations
    const slowestOperations = recentMetrics
      .filter(metric => !metric.name.includes('_error'))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(metric => ({ name: metric.name, time: metric.value }));

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      slowestOperations,
      recentMetrics: recentMetrics.slice(-10) // Last 10 metrics
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  /**
   * Get metrics by time range
   */
  getMetricsByTimeRange(startTime: Date, endTime: Date): PerformanceMetric[] {
    return this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(metric => metric.timestamp > cutoffTime);
  }

  /**
   * Get performance health score (0-100)
   */
  getHealthScore(): number {
    const stats = this.getPerformanceStats();
    
    // Base score
    let score = 100;
    
    // Penalize for high error rate
    if (stats.errorRate > 10) score -= 30;
    else if (stats.errorRate > 5) score -= 20;
    else if (stats.errorRate > 1) score -= 10;
    
    // Penalize for slow response times
    if (stats.averageResponseTime > 5000) score -= 30;
    else if (stats.averageResponseTime > 2000) score -= 20;
    else if (stats.averageResponseTime > 1000) score -= 10;
    
    // Penalize for too many slow operations
    if (stats.slowestOperations.length > 3) score -= 15;
    else if (stats.slowestOperations.length > 1) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory_used',
        value: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
        unit: 'MB',
        timestamp: new Date(),
        context: {
          total: memory.totalJSHeapSize / 1024 / 1024,
          limit: memory.jsHeapSizeLimit / 1024 / 1024
        }
      });
    }
  }

  /**
   * Monitor network performance
   */
  monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.recordMetric({
        name: 'network_connection',
        value: connection.effectiveType === '4g' ? 4 : 
               connection.effectiveType === '3g' ? 3 : 
               connection.effectiveType === '2g' ? 2 : 1,
        unit: 'level',
        timestamp: new Date(),
        context: {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        }
      });
    }
  }

  /**
   * Start continuous monitoring
   */
  startContinuousMonitoring(): void {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 30000);

    // Monitor network performance every minute
    setInterval(() => {
      this.monitorNetworkPerformance();
    }, 60000);

    // Clear old metrics every hour
    setInterval(() => {
      this.clearOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      stats: this.getPerformanceStats(),
      healthScore: this.getHealthScore()
    }, null, 2);
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = [];
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();
