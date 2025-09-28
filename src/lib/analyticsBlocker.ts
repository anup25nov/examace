/**
 * Analytics Blocker Utility
 * Blocks unwanted analytics and tracking requests
 */

// Block Razorpay analytics requests
export const blockRazorpayAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Block fetch requests to Razorpay analytics (but allow checkout script and API)
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('lumberjack.razorpay.com')) {
      console.log('🚫 Blocked Razorpay analytics request:', url);
      return Promise.reject(new Error('Analytics blocked by privacy policy'));
    }
    return originalFetch.apply(this, args);
  };

  // Block XMLHttpRequest to Razorpay analytics (but allow checkout script)
  const originalXHR = window.XMLHttpRequest;
  const XHRConstructor = function() {
    const xhr = new originalXHR();
    const originalOpen = xhr.open;
    
    xhr.open = function(method: string, url: string | URL, ...args: any[]) {
      const urlString = url.toString();
      if (urlString.includes('lumberjack.razorpay.com')) {
        console.log('🚫 Blocked Razorpay analytics XHR request:', urlString);
        throw new Error('Analytics blocked by privacy policy');
      }
      return originalOpen.apply(this, [method, url, ...args]);
    };
    
    return xhr;
  } as any;
  
  // Copy static properties
  Object.setPrototypeOf(XHRConstructor, originalXHR);
  Object.defineProperty(XHRConstructor, 'prototype', { value: originalXHR.prototype });
  Object.defineProperty(XHRConstructor, 'UNSENT', { value: 0 });
  Object.defineProperty(XHRConstructor, 'OPENED', { value: 1 });
  Object.defineProperty(XHRConstructor, 'HEADERS_RECEIVED', { value: 2 });
  Object.defineProperty(XHRConstructor, 'LOADING', { value: 3 });
  Object.defineProperty(XHRConstructor, 'DONE', { value: 4 });
  
  window.XMLHttpRequest = XHRConstructor;

  console.log('✅ Razorpay analytics blocker initialized');
};

// Initialize analytics blocking
export const initAnalyticsBlocker = () => {
  blockRazorpayAnalytics();
};
