// Force Disable Service Worker Script
// Run this in your browser console to completely remove service workers

console.log('🔧 Force disabling all service workers...');

async function forceDisableAll() {
  try {
    // 1. Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('Found service worker registrations:', registrations.length);
      
      for (let registration of registrations) {
        const unregistered = await registration.unregister();
        console.log('✅ Unregistered service worker:', unregistered);
      }
    }
    
    // 2. Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log('Found caches:', cacheNames);
      
      for (let cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✅ Deleted cache:', cacheName);
      }
    }
    
    // 3. Clear localStorage debug logs
    localStorage.removeItem('mobileDebugLogs');
    localStorage.removeItem('enableServiceWorker');
    console.log('✅ Cleared localStorage');
    
    // 4. Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ Cleared sessionStorage');
    
    // 5. Disable service worker registration
    if ('serviceWorker' in navigator) {
      // Override the register method to prevent registration
      navigator.serviceWorker.register = function() {
        console.log('🚫 Service worker registration blocked');
        return Promise.reject(new Error('Service worker registration disabled'));
      };
    }
    
    console.log('🎉 All service workers completely disabled!');
    console.log('🔄 Please refresh the page to see the changes.');
    
  } catch (error) {
    console.error('❌ Error disabling service workers:', error);
  }
}

// Run the function
forceDisableAll();

// Also make it available globally
window.forceDisableSW = forceDisableAll;
