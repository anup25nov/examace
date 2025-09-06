import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initPerformanceOptimizations } from './lib/performance'
import { initNavigationOptimizations } from './lib/navigationOptimizer'

// Initialize performance optimizations
try {
  initPerformanceOptimizations();
} catch (error) {
  console.warn('Performance optimizations failed to initialize:', error);
}

// Initialize navigation optimizations
try {
  initNavigationOptimizations();
} catch (error) {
  console.warn('Navigation optimizations failed to initialize:', error);
}

// Ensure root element exists before creating React root
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure there's a div with id='root' in your HTML.");
}

// Create root only once
const root = createRoot(rootElement);
root.render(<App />);
