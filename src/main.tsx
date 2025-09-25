import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPerformanceOptimizations } from './lib/performance'
import { initNavigationOptimizations } from './lib/navigationOptimizer'
import { validateEnvironment } from './lib/envValidation'
import { initMonitoring } from './lib/monitoring'
import { mobileDebugger } from './lib/mobileDebugger'

// Initialize application
async function initializeApp() {
  try {
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
    console.error('Failed to initialize application:', error);
    throw error;
  }
}

// Start the application
initializeApp().catch(error => {
  console.error('Application initialization failed:', error);
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
