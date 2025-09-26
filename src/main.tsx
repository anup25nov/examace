import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPerformanceOptimizations } from './lib/performance'
import { initNavigationOptimizations } from './lib/navigationOptimizer'
import { validateEnvironment } from './lib/envValidation'
import { initMonitoring } from './lib/monitoring'
import { mobileDebugger } from './lib/mobileDebugger'
import { cacheService } from './lib/cacheService'

// Force disable service worker in development
async function forceDisableServiceWorker() {
  try {
    mobileDebugger.info('Force disabling service worker...');
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      mobileDebugger.info('Found service worker registrations:', registrations.length);
      
      for (let registration of registrations) {
        const unregistered = await registration.unregister();
        mobileDebugger.info('Unregistered service worker:', unregistered);
      }
    }
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      mobileDebugger.info('Found caches:', cacheNames);
      
      for (let cacheName of cacheNames) {
        await caches.delete(cacheName);
        mobileDebugger.info('Deleted cache:', cacheName);
      }
    }
    
    mobileDebugger.info('Service worker completely disabled');
  } catch (error) {
    mobileDebugger.error('Failed to disable service worker:', error);
  }
}

// Initialize caching system
async function initializeCaching() {
  try {
    mobileDebugger.info('Initializing caching system...');
    mobileDebugger.info('Environment:', process.env.NODE_ENV);
    mobileDebugger.info('Service Worker support:', 'serviceWorker' in navigator);
    mobileDebugger.info('Current URL:', window.location.href);
    
    // Force disable service worker in development
    if (process.env.NODE_ENV === 'development') {
      await forceDisableServiceWorker();
    }
    
           // Register service worker with error handling (only in production or when explicitly enabled)
           if ('serviceWorker' in navigator && (process.env.NODE_ENV === 'production' || localStorage.getItem('enableServiceWorker') === 'true')) {
             try {
               const registration = await navigator.serviceWorker.register('/sw.js');
               mobileDebugger.info('Service worker registered successfully');
               
               // Listen for service worker updates
               registration.addEventListener('updatefound', () => {
                 mobileDebugger.info('Service worker update found');
               });
             } catch (error) {
               mobileDebugger.warn('Service worker registration failed:', error);
               // Don't throw - continue with app initialization
             }
           } else {
             // Completely disable service worker in development
             mobileDebugger.info('Service worker disabled in development mode');
             mobileDebugger.info('To enable: localStorage.setItem("enableServiceWorker", "true")');
             
             // Unregister any existing service workers
             try {
               const registrations = await navigator.serviceWorker.getRegistrations();
               for (let registration of registrations) {
                 await registration.unregister();
                 mobileDebugger.info('Unregistered existing service worker');
               }
             } catch (error) {
               mobileDebugger.warn('Failed to unregister service workers:', error);
             }
           }
    
    // Preload critical images
    await cacheService.preloadCriticalImages();
    
    // Clear expired cache
    cacheService.clearExpiredCache();
    
    
    mobileDebugger.info('Caching system initialized successfully');
  } catch (error) {
    mobileDebugger.error('Caching initialization failed', error);
  }
}

// Global error handlers
function setupGlobalErrorHandlers() {
  // Catch unhandled promise rejections (like fetch errors)
  window.addEventListener('unhandledrejection', (event) => {
    mobileDebugger.error('Unhandled Promise Rejection:', event.reason);
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Prevent the default behavior (which would log to console)
    event.preventDefault();
  });
  
  // Catch general errors
  window.addEventListener('error', (event) => {
    mobileDebugger.error('Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Catch fetch errors specifically
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      return response;
    } catch (error) {
      mobileDebugger.error('Fetch Error:', {
        url: args[0],
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  };
}

// Initialize application
async function initializeApp() {
  try {
    // Setup global error handlers first
    setupGlobalErrorHandlers();
    
    // Initialize mobile debugger first
    mobileDebugger.info('App Initialization Started');
    
    // Validate environment variables first
    validateEnvironment();
    
    // Initialize performance optimizations
    initPerformanceOptimizations();
    
    // Initialize navigation optimizations
    initNavigationOptimizations();
    
    // Initialize production monitoring
    if (process.env.NODE_ENV === 'production') {
      await initMonitoring();
    }
    
    // Initialize caching
    await initializeCaching();
    
    // Log performance metrics
    mobileDebugger.logPerformance();
    
    // Ensure root element exists before creating React root
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found. Make sure there's a div with id='root' in your HTML.");
    }
    
    // Create root only once
    const root = createRoot(rootElement);
    root.render(<App />);
    
  } catch (error) {
    throw error;
  }
}

// Start the application
initializeApp().catch(() => {
  // Show user-friendly error message
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 2rem; text-align: center; font-family: Arial, sans-serif;">
        <h1>Application Error</h1>
        <p>Failed to initialize the application. Please refresh the page or contact support.</p>
        <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; margin-top: 1rem;">
          Refresh Page
        </button>
      </div>
    `;
  }
});
