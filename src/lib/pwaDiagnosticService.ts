export interface PWADiagnosticResult {
  isPWA: boolean;
  isInstallable: boolean;
  hasServiceWorker: boolean;
  hasManifest: boolean;
  isOfflineCapable: boolean;
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

export interface PWAIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

export class PWADiagnosticService {
  private static instance: PWADiagnosticService;

  public static getInstance(): PWADiagnosticService {
    if (!PWADiagnosticService.instance) {
      PWADiagnosticService.instance = new PWADiagnosticService();
    }
    return PWADiagnosticService.instance;
  }

  /**
   * Run comprehensive PWA diagnostic
   */
  async runDiagnostic(): Promise<PWADiagnosticResult> {
    const issues: PWAIssue[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check if running as PWA
    const isPWA = this.checkIfPWA();
    if (!isPWA) {
      issues.push({
        type: 'info',
        message: 'Not running as PWA',
        fix: 'Install the app to run as PWA'
      });
    }

    // Check if installable
    const isInstallable = await this.checkInstallability();
    if (!isInstallable) {
      issues.push({
        type: 'warning',
        message: 'App is not installable',
        fix: 'Ensure manifest.json is valid and service worker is registered'
      });
      score -= 20;
    }

    // Check service worker
    const hasServiceWorker = await this.checkServiceWorker();
    if (!hasServiceWorker) {
      issues.push({
        type: 'error',
        message: 'No service worker found',
        fix: 'Register a service worker for offline functionality'
      });
      score -= 30;
    }

    // Check manifest
    const hasManifest = await this.checkManifest();
    if (!hasManifest) {
      issues.push({
        type: 'error',
        message: 'No manifest.json found',
        fix: 'Add a valid manifest.json file'
      });
      score -= 25;
    }

    // Check offline capability
    const isOfflineCapable = await this.checkOfflineCapability();
    if (!isOfflineCapable) {
      issues.push({
        type: 'warning',
        message: 'Limited offline capability',
        fix: 'Implement proper caching strategies'
      });
      score -= 15;
    }

    // Check HTTPS
    const isHTTPS = this.checkHTTPS();
    if (!isHTTPS) {
      issues.push({
        type: 'error',
        message: 'Not running on HTTPS',
        fix: 'PWA requires HTTPS in production'
      });
      score -= 20;
    }

    // Check responsive design
    const isResponsive = this.checkResponsiveDesign();
    if (!isResponsive) {
      issues.push({
        type: 'warning',
        message: 'Not fully responsive',
        fix: 'Ensure app works on all screen sizes'
      });
      score -= 10;
    }

    // Generate recommendations
    if (issues.length === 0) {
      recommendations.push('✅ Your PWA is fully optimized!');
    } else {
      issues.forEach(issue => {
        if (issue.fix) {
          recommendations.push(`🔧 ${issue.fix}`);
        }
      });
    }

    return {
      isPWA,
      isInstallable,
      hasServiceWorker,
      hasManifest,
      isOfflineCapable,
      issues: issues.map(issue => issue.message),
      recommendations,
      score: Math.max(0, score)
    };
  }

  /**
   * Check specific PWA features
   */
  async checkFeature(feature: string): Promise<{ supported: boolean; details: string }> {
    switch (feature) {
      case 'service-worker':
        return this.checkServiceWorkerFeature();
      case 'manifest':
        return this.checkManifestFeature();
      case 'offline':
        return this.checkOfflineFeature();
      case 'push-notifications':
        return this.checkPushNotificationsFeature();
      case 'background-sync':
        return this.checkBackgroundSyncFeature();
      case 'install-prompt':
        return this.checkInstallPromptFeature();
      default:
        return { supported: false, details: 'Unknown feature' };
    }
  }

  /**
   * Fix common PWA issues
   */
  async fixIssues(): Promise<{ fixed: string[]; failed: string[] }> {
    const fixed: string[] = [];
    const failed: string[] = [];

    try {
      // Try to register service worker
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw-enhanced.js');
          fixed.push('Service worker registered');
        } catch (error) {
          failed.push('Failed to register service worker');
        }
      }

      // Try to update manifest
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
          const link = document.createElement('link');
          link.rel = 'manifest';
          link.href = '/manifest.json';
          document.head.appendChild(link);
          fixed.push('Manifest link added');
        }
      } catch (error) {
        failed.push('Failed to add manifest link');
      }

      // Try to add theme color
      try {
        const themeColor = document.querySelector('meta[name="theme-color"]');
        if (!themeColor) {
          const meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = '#3b82f6';
          document.head.appendChild(meta);
          fixed.push('Theme color meta tag added');
        }
      } catch (error) {
        failed.push('Failed to add theme color');
      }

    } catch (error) {
      failed.push('General fix failed');
    }

    return { fixed, failed };
  }

  // Private helper methods

  private checkIfPWA(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  private async checkInstallability(): Promise<boolean> {
    try {
      // Check if beforeinstallprompt event is available
      return 'onbeforeinstallprompt' in window;
    } catch (error) {
      return false;
    }
  }

  private async checkServiceWorker(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    } catch (error) {
      return false;
    }
  }

  private async checkManifest(): Promise<boolean> {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        return false;
      }

      const response = await fetch('/manifest.json');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkOfflineCapability(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        return false;
      }

      // Check if service worker has caching strategies
      const registration = registrations[0];
      const sw = registration.active || registration.waiting || registration.installing;
      
      if (!sw) {
        return false;
      }

      // This is a simplified check - in reality, you'd need to inspect the service worker code
      return true;
    } catch (error) {
      return false;
    }
  }

  private checkHTTPS(): boolean {
    return location.protocol === 'https:' || location.hostname === 'localhost';
  }

  private checkResponsiveDesign(): boolean {
    // Check if viewport meta tag exists
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      return false;
    }

    // Check if CSS media queries are likely present (simplified check)
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    return stylesheets.length > 0;
  }

  private async checkServiceWorkerFeature(): Promise<{ supported: boolean; details: string }> {
    if (!('serviceWorker' in navigator)) {
      return { supported: false, details: 'Service Worker not supported in this browser' };
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        return { supported: false, details: 'No service worker registered' };
      }

      return { supported: true, details: `${registrations.length} service worker(s) registered` };
    } catch (error) {
      return { supported: false, details: 'Error checking service worker' };
    }
  }

  private async checkManifestFeature(): Promise<{ supported: boolean; details: string }> {
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (!manifestLink) {
        return { supported: false, details: 'No manifest link found' };
      }

      const response = await fetch('/manifest.json');
      if (!response.ok) {
        return { supported: false, details: 'Manifest file not accessible' };
      }

      const manifest = await response.json();
      return { 
        supported: true, 
        details: `Manifest found: ${manifest.name || 'Untitled'}` 
      };
    } catch (error) {
      return { supported: false, details: 'Error checking manifest' };
    }
  }

  private async checkOfflineFeature(): Promise<{ supported: boolean; details: string }> {
    if (!navigator.onLine) {
      return { supported: true, details: 'Currently offline - testing offline capability' };
    }

    try {
      // Try to access a cached resource
      const response = await fetch('/', { cache: 'only-if-cached' });
      return { 
        supported: response.ok, 
        details: response.ok ? 'Offline capability detected' : 'No offline capability' 
      };
    } catch (error) {
      return { supported: false, details: 'No offline capability' };
    }
  }

  private async checkPushNotificationsFeature(): Promise<{ supported: boolean; details: string }> {
    if (!('serviceWorker' in navigator)) {
      return { supported: false, details: 'Service Worker required for push notifications' };
    }

    if (!('PushManager' in window)) {
      return { supported: false, details: 'Push notifications not supported' };
    }

    try {
      const permission = await Notification.requestPermission();
      return { 
        supported: permission === 'granted', 
        details: `Notification permission: ${permission}` 
      };
    } catch (error) {
      return { supported: false, details: 'Error checking push notifications' };
    }
  }

  private async checkBackgroundSyncFeature(): Promise<{ supported: boolean; details: string }> {
    if (!('serviceWorker' in navigator)) {
      return { supported: false, details: 'Service Worker required for background sync' };
    }

    if (!('sync' in window.ServiceWorkerRegistration.prototype)) {
      return { supported: false, details: 'Background sync not supported' };
    }

    return { supported: true, details: 'Background sync supported' };
  }

  private async checkInstallPromptFeature(): Promise<{ supported: boolean; details: string }> {
    if (!('onbeforeinstallprompt' in window)) {
      return { supported: false, details: 'Install prompt not supported' };
    }

    return { supported: true, details: 'Install prompt supported' };
  }
}

export const pwaDiagnosticService = PWADiagnosticService.getInstance();
