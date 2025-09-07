// Firebase Analytics Service
// This service handles user behavior tracking and analytics

interface AnalyticsEvent {
  event: string;
  parameters?: {
    [key: string]: any;
  };
}

interface UserProperties {
  [key: string]: any;
}

class AnalyticsService {
  private isInitialized = false;
  private events: AnalyticsEvent[] = [];
  private userProperties: UserProperties = {};

  // Initialize analytics (placeholder for Firebase Analytics)
  init() {
    this.isInitialized = true;
    console.log('Analytics initialized');
  }

  // Track page views
  trackPageView(pageName: string, pageTitle?: string) {
    const event: AnalyticsEvent = {
      event: 'page_view',
      parameters: {
        page_name: pageName,
        page_title: pageTitle || pageName,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        device_type: this.getDeviceType(),
        platform: navigator.platform
      }
    };
    
    this.logEvent(event);
  }

  // Track test interactions
  trackTestStart(examId: string, testType: string, testId: string) {
    const event: AnalyticsEvent = {
      event: 'test_start',
      parameters: {
        exam_id: examId,
        test_type: testType,
        test_id: testId,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track test completion
  trackTestComplete(examId: string, testType: string, testId: string, score: number, timeTaken: number) {
    const event: AnalyticsEvent = {
      event: 'test_complete',
      parameters: {
        exam_id: examId,
        test_type: testType,
        test_id: testId,
        score: score,
        time_taken: timeTaken,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track solution viewing
  trackSolutionView(examId: string, testType: string, testId: string) {
    const event: AnalyticsEvent = {
      event: 'solution_view',
      parameters: {
        exam_id: examId,
        test_type: testType,
        test_id: testId,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track retry attempts
  trackTestRetry(examId: string, testType: string, testId: string) {
    const event: AnalyticsEvent = {
      event: 'test_retry',
      parameters: {
        exam_id: examId,
        test_type: testType,
        test_id: testId,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track section interactions
  trackSectionOpen(sectionId: string, examId: string) {
    const event: AnalyticsEvent = {
      event: 'section_open',
      parameters: {
        section_id: sectionId,
        exam_id: examId,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track exam selection
  trackExamSelect(examId: string) {
    const event: AnalyticsEvent = {
      event: 'exam_select',
      parameters: {
        exam_id: examId,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track performance statistics views
  trackPerformanceView(examId: string, stats: any) {
    const event: AnalyticsEvent = {
      event: 'performance_view',
      parameters: {
        exam_id: examId,
        total_tests: stats.totalTests,
        average_score: stats.avgScore,
        best_score: stats.bestScore,
        best_rank: stats.bestRank,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track errors
  trackError(errorType: string, errorMessage: string, context?: any) {
    const event: AnalyticsEvent = {
      event: 'error_occurred',
      parameters: {
        error_type: errorType,
        error_message: errorMessage,
        context: context,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType(),
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    };
    
    this.logEvent(event);
  }

  // Track user engagement
  trackEngagement(action: string, duration?: number) {
    const event: AnalyticsEvent = {
      event: 'user_engagement',
      parameters: {
        action: action,
        duration: duration,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Track most used features
  trackFeatureUsage(feature: string, examId?: string) {
    const event: AnalyticsEvent = {
      event: 'feature_usage',
      parameters: {
        feature: feature,
        exam_id: examId,
        timestamp: new Date().toISOString(),
        device_type: this.getDeviceType()
      }
    };
    
    this.logEvent(event);
  }

  // Set user properties
  setUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };
    console.log('User properties set:', this.userProperties);
  }

  // Get device type
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
      if (/tablet|ipad/.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }
    return 'desktop';
  }

  // Log event (placeholder for Firebase Analytics)
  private logEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) {
      this.init();
    }

    // Add user properties to event
    const eventWithUserProps = {
      ...event,
      parameters: {
        ...event.parameters,
        ...this.userProperties
      }
    };

    // Log to console for development
    console.log('Analytics Event:', eventWithUserProps);

    // Store in local storage for debugging
    const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    storedEvents.push(eventWithUserProps);
    
    // Keep only last 100 events
    if (storedEvents.length > 100) {
      storedEvents.splice(0, storedEvents.length - 100);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(storedEvents));

    // Here you would normally send to Firebase Analytics
    // Example: analytics().logEvent(event.event, event.parameters);
  }

  // Get analytics data for debugging
  getAnalyticsData() {
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    return {
      events,
      userProperties: this.userProperties,
      deviceType: this.getDeviceType()
    };
  }

  // Clear analytics data
  clearAnalyticsData() {
    localStorage.removeItem('analytics_events');
    this.userProperties = {};
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Initialize analytics on import
analytics.init();

// Export types
export type { AnalyticsEvent, UserProperties };
