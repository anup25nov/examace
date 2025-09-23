/**
 * Comprehensive Error Handling Service
 * Provides centralized error handling, logging, and user-friendly error messages
 */

import { supabase } from '@/integrations/supabase/client';

export interface ErrorContext {
  userId?: string;
  action?: string;
  resource?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'authentication' | 'authorization' | 'network' | 'database' | 'payment' | 'system';
  context?: ErrorContext;
  stack?: string;
  retryable: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}

export interface NetworkState {
  isOnline: boolean;
  lastOnlineTime: Date | null;
  retryQueue: Array<() => Promise<any>>;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 1000;
  private networkState: NetworkState = {
    isOnline: navigator.onLine,
    lastOnlineTime: navigator.onLine ? new Date() : null,
    retryQueue: []
  };
  private defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error) => this.isRetryableError(error)
  };

  private constructor() {
    this.setupNetworkMonitoring();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle and process errors
   */
  handleError(error: any, context?: ErrorContext): ErrorInfo {
    const errorInfo = this.processError(error, context);
    this.logError(errorInfo);
    return errorInfo;
  }

  /**
   * Process error and create standardized error info
   */
  private processError(error: any, context?: ErrorContext): ErrorInfo {
    // Determine error category and severity
    const { category, severity, retryable } = this.categorizeError(error);
    
    // Generate error code
    const code = this.generateErrorCode(error, category);
    
    // Get user-friendly message
    const userMessage = this.getUserFriendlyMessage(error, category);
    
    // Get technical message
    const message = this.getTechnicalMessage(error);

    return {
      code,
      message,
      userMessage,
      severity,
      category,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
      },
      stack: error.stack,
      retryable
    };
  }

  /**
   * Categorize error based on type and content
   */
  private categorizeError(error: any): {
    category: ErrorInfo['category'];
    severity: ErrorInfo['severity'];
    retryable: boolean;
  } {
    // Network errors
    if (error.name === 'NetworkError' || error.message?.includes('network') || error.message?.includes('fetch')) {
      return {
        category: 'network',
        severity: 'medium',
        retryable: true
      };
    }

    // Authentication errors
    if (error.message?.includes('auth') || error.message?.includes('unauthorized') || error.message?.includes('token')) {
      return {
        category: 'authentication',
        severity: 'high',
        retryable: false
      };
    }

    // Authorization errors
    if (error.message?.includes('permission') || error.message?.includes('forbidden') || error.message?.includes('access denied')) {
      return {
        category: 'authorization',
        severity: 'high',
        retryable: false
      };
    }

    // Validation errors
    if (error.message?.includes('validation') || error.message?.includes('invalid') || error.message?.includes('required')) {
      return {
        category: 'validation',
        severity: 'low',
        retryable: false
      };
    }

    // Database errors
    if (error.message?.includes('database') || error.message?.includes('sql') || error.message?.includes('constraint')) {
      return {
        category: 'database',
        severity: 'high',
        retryable: true
      };
    }

    // Payment errors
    if (error.message?.includes('payment') || error.message?.includes('razorpay') || error.message?.includes('transaction')) {
      return {
        category: 'payment',
        severity: 'critical',
        retryable: true
      };
    }

    // Default to system error
    return {
      category: 'system',
      severity: 'medium',
      retryable: true
    };
  }

  /**
   * Generate error code
   */
  private generateErrorCode(error: any, category: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${category.toUpperCase()}_${timestamp}_${random}`;
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: any, category: string): string {
    const messages = {
      validation: 'Please check your input and try again.',
      authentication: 'Please log in again to continue.',
      authorization: 'You don\'t have permission to perform this action.',
      network: 'Please check your internet connection and try again.',
      database: 'We\'re experiencing technical difficulties. Please try again later.',
      payment: 'Payment processing failed. Please try again or contact support.',
      system: 'Something went wrong. Please try again later.'
    };

    // Check for specific error messages
    if (error.message?.includes('email already exists')) {
      return 'This email is already registered. Please use a different email or try logging in.';
    }

    if (error.message?.includes('phone already exists')) {
      return 'This phone number is already registered. Please use a different number or try logging in.';
    }

    if (error.message?.includes('invalid email')) {
      return 'Please enter a valid email address.';
    }

    if (error.message?.includes('invalid phone')) {
      return 'Please enter a valid 10-digit phone number.';
    }

    if (error.message?.includes('test already completed')) {
      return 'You have already completed this test.';
    }

    if (error.message?.includes('membership expired')) {
      return 'Your membership has expired. Please renew to continue.';
    }

    if (error.message?.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    return messages[category] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get technical error message
   */
  private getTechnicalMessage(error: any): string {
    if (error.message) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error.name) {
      return `${error.name}: ${error.message || 'Unknown error'}`;
    }

    return 'Unknown error occurred';
  }

  /**
   * Log error
   */
  private logError(errorInfo: ErrorInfo): void {
    // Add to local log
    this.errorLog.push(errorInfo);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console based on severity
    switch (errorInfo.severity) {
      case 'critical':
        console.error('🚨 CRITICAL ERROR:', errorInfo);
        break;
      case 'high':
        console.error('❌ HIGH SEVERITY ERROR:', errorInfo);
        break;
      case 'medium':
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', errorInfo);
        break;
      case 'low':
        console.info('ℹ️ LOW SEVERITY ERROR:', errorInfo);
        break;
    }

    // In production, you might want to send errors to a logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(errorInfo);
    }
  }

  /**
   * Send error to external logging service
   */
  private async sendToLoggingService(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Send to Supabase security audit log (using any to bypass type checking)
      const { error } = await (supabase as any)
        .from('security_audit_log')
        .insert({
          user_id: errorInfo.context?.userId || null,
          action: 'error_logged',
          resource: 'error_handling',
          success: false,
          error_message: errorInfo.message,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log error to database:', error);
      }
    } catch (error) {
      console.error('Failed to send error to logging service:', error);
    }
  }

  /**
   * Get error log
   */
  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: string): ErrorInfo[] {
    return this.errorLog.filter(error => error.category === category);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: string): ErrorInfo[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    recent: number; // errors in last hour
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let recent = 0;

    this.errorLog.forEach(error => {
      // Count by category
      byCategory[error.category] = (byCategory[error.category] || 0) + 1;
      
      // Count by severity
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      // Count recent errors
      if (error.context?.timestamp) {
        const errorTime = new Date(error.context.timestamp).getTime();
        if (errorTime > oneHourAgo) {
          recent++;
        }
      }
    });

    return {
      total: this.errorLog.length,
      byCategory,
      bySeverity,
      recent
    };
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.networkState.isOnline = true;
      this.networkState.lastOnlineTime = new Date();
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      this.networkState.isOnline = false;
    });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const { retryable } = this.categorizeError(error);
    return retryable && this.networkState.isOnline;
  }

  /**
   * Execute function with retry mechanism
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    context?: ErrorContext
  ): Promise<T> {
    const retryConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: any;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt === retryConfig.maxRetries || 
            !retryConfig.retryCondition?.(error) ||
            !this.networkState.isOnline) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
          retryConfig.maxDelay
        );

        // Log retry attempt
        this.handleError(error, {
          ...context,
          action: `retry_attempt_${attempt + 1}`,
          resource: 'retry_mechanism'
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we're offline, queue the function for later retry
    if (!this.networkState.isOnline) {
      this.networkState.retryQueue.push(fn);
      throw new Error('Network offline. Request queued for retry when connection is restored.');
    }

    // All retries failed, throw the last error
    throw lastError;
  }

  /**
   * Process retry queue when network comes back online
   */
  private async processRetryQueue(): Promise<void> {
    if (this.networkState.retryQueue.length === 0) return;

    console.log(`🔄 Processing ${this.networkState.retryQueue.length} queued requests...`);
    
    const queue = [...this.networkState.retryQueue];
    this.networkState.retryQueue = [];

    for (const fn of queue) {
      try {
        await fn();
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Re-queue if still retryable
        if (this.isRetryableError(error)) {
          this.networkState.retryQueue.push(fn);
        }
      }
    }
  }

  /**
   * Get network state
   */
  getNetworkState(): NetworkState {
    return { ...this.networkState };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.networkState.isOnline;
  }

  /**
   * Get retry queue length
   */
  getRetryQueueLength(): number {
    return this.networkState.retryQueue.length;
  }

  /**
   * Create error boundary for React components
   */
  createErrorBoundary() {
    // This would need to be implemented in a separate .tsx file
    // For now, return a simple function that handles errors
    return (error: any, errorInfo: any) => {
      this.handleError(error, {
        action: 'component_error',
        resource: 'react_component'
      });
    };
  }
}

// Default error fallback component (simplified for TypeScript)
const DefaultErrorFallback = (error: ErrorInfo) => {
  console.error('Error fallback:', error);
  return null;
};

export const errorHandlingService = ErrorHandlingService.getInstance();

// React hook for error handling
export function useErrorHandler() {
  const handleError = (error: any, context?: ErrorContext) => {
    return errorHandlingService.handleError(error, context);
  };

  const getErrorStats = () => {
    return errorHandlingService.getErrorStats();
  };

  const clearErrors = () => {
    errorHandlingService.clearErrorLog();
  };

  return {
    handleError,
    getErrorStats,
    clearErrors
  };
}
