// Service Worker Disable Script
// Run this in your browser console to disable the service worker temporarily

console.log('🔧 Disabling Service Worker...');

// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister().then(function(boolean) {
        console.log('✅ Service Worker unregistered:', boolean);
      });
    }
  });
}

// Clear all caches
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('🗑️ Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('✅ All caches cleared');
  });
}

// Clear localStorage debug logs
localStorage.removeItem('mobileDebugLogs');
console.log('✅ Mobile debug logs cleared');

console.log('🎉 Service Worker disabled and caches cleared!');
console.log('Refresh the page to see the changes.');
