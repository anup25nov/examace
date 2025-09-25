// Mobile Debugger - Enhanced error logging and debugging for mobile devices
interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
}

class MobileDebugger {
  private logs: DebugLog[] = [];
  private maxLogs = 100;
  private isEnabled = true;

  constructor() {
    this.setupErrorHandlers();
    this.setupConsoleOverrides();
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.log('error', 'Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.log('error', 'Unhandled Promise Rejection', {
        reason: event.reason?.toString(),
        stack: event.reason?.stack
      });
    });

    // React error boundary handler
    window.addEventListener('react-error', (event: any) => {
      this.log('error', 'React Error Boundary', {
        error: event.detail?.error?.toString(),
        componentStack: event.detail?.componentStack,
        errorInfo: event.detail?.errorInfo
      });
    });
  }

  private setupConsoleOverrides() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    // Override console methods to capture logs
    console.log = (...args) => {
      this.log('info', args.join(' '), args.length > 1 ? args : undefined);
      originalConsole.log.apply(console, args);
    };

    console.warn = (...args) => {
      this.log('warn', args.join(' '), args.length > 1 ? args : undefined);
      originalConsole.warn.apply(console, args);
    };

    console.error = (...args) => {
      this.log('error', args.join(' '), args.length > 1 ? args : undefined);
      originalConsole.error.apply(console, args);
    };

    console.info = (...args) => {
      this.log('info', args.join(' '), args.length > 1 ? args : undefined);
      originalConsole.info.apply(console, args);
    };
  }

  private log(level: DebugLog['level'], message: string, data?: any, stack?: string) {
    if (!this.isEnabled) return;

    const logEntry: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      stack: stack || (data?.stack),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('mobile-debug-logs', JSON.stringify(this.logs.slice(-20)));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Public methods
  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }

  public debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  public getLogs(): DebugLog[] {
    return [...this.logs];
  }

  public getRecentLogs(count: number = 20): DebugLog[] {
    return this.logs.slice(-count);
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem('mobile-debug-logs');
  }

  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  // Mobile-specific debugging
  public logTouchEvent(type: string, event: TouchEvent) {
    this.debug(`Touch Event: ${type}`, {
      touches: event.touches.length,
      target: (event.target as Element)?.tagName,
      clientX: event.touches[0]?.clientX,
      clientY: event.touches[0]?.clientY
    });
  }

  public logScrollEvent(event: Event) {
    const target = event.target as Element;
    this.debug('Scroll Event', {
      scrollTop: (target as any)?.scrollTop,
      scrollHeight: (target as any)?.scrollHeight,
      clientHeight: (target as any)?.clientHeight,
      target: target?.tagName
    });
  }

  public logPerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.info('Performance Metrics', {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      });
    }
  }
}

// Create global instance
export const mobileDebugger = new MobileDebugger();

// Expose to window for debugging
if (typeof window !== 'undefined') {
  (window as any).mobileDebugger = mobileDebugger;
  (window as any).debugLogs = () => mobileDebugger.getLogs();
  (window as any).exportDebugLogs = () => mobileDebugger.exportLogs();
  (window as any).clearDebugLogs = () => mobileDebugger.clearLogs();
}

export default mobileDebugger;
