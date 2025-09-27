// Enhanced Service Worker for ExamAce PWA
const CACHE_NAME = 'examace-v1.0.0';
const STATIC_CACHE = 'examace-static-v1.0.0';
const DYNAMIC_CACHE = 'examace-dynamic-v1.0.0';
const API_CACHE = 'examace-api-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logos/icon-192x192.png',
  '/logos/icon-512x512.png',
  '/logos/examace-logo.svg',
  '/favicon.ico'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/exams',
  '/api/user-profile',
  '/api/test-stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('📦 Caching API endpoints...');
        return cache.addAll(API_ENDPOINTS.map(endpoint => new Request(endpoint, { method: 'GET' })));
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE && 
              cacheName !== API_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Handle different types of requests
    if (isStaticAsset(request)) {
      return await handleStaticAsset(request);
    } else if (isAPIRequest(request)) {
      return await handleAPIRequest(request);
    } else if (isPageRequest(request)) {
      return await handlePageRequest(request);
    } else {
      return await handleOtherRequest(request);
    }
  } catch (error) {
    console.error('❌ Service Worker fetch error:', error);
    return new Response('Service Worker Error', { status: 500 });
  }
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/');
}

function isPageRequest(request) {
  const url = new URL(request.url);
  return url.pathname === '/' || url.pathname.startsWith('/exam/') || url.pathname.startsWith('/test/');
}

async function handleStaticAsset(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 404 });
  }
}

async function handleAPIRequest(request) {
  // Try network first for API requests
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful API responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API
    return new Response(JSON.stringify({
      success: false,
      error: 'You are offline. Please check your connection.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePageRequest(request) {
  // Try cache first for pages
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch from network and cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ExamAce - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0; padding: 20px; background: #f5f5f5;
              display: flex; align-items: center; justify-content: center; min-height: 100vh;
            }
            .offline-container { 
              text-align: center; background: white; padding: 40px; border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px;
            }
            .offline-icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #374151; margin-bottom: 16px; }
            p { color: #6b7280; margin-bottom: 24px; }
            .retry-btn {
              background: #3b82f6; color: white; border: none; padding: 12px 24px;
              border-radius: 8px; cursor: pointer; font-size: 16px;
            }
            .retry-btn:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">
              Try Again
            </button>
          </div>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function handleOtherRequest(request) {
  // Default handling - try cache first, then network
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', { status: 404 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'test-submission') {
    event.waitUntil(syncTestSubmissions());
  } else if (event.tag === 'user-actions') {
    event.waitUntil(syncUserActions());
  }
});

async function syncTestSubmissions() {
  try {
    // Get pending test submissions from IndexedDB
    const pendingSubmissions = await getPendingSubmissions();
    
    for (const submission of pendingSubmissions) {
      try {
        const response = await fetch('/api/test-submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submission)
        });
        
        if (response.ok) {
          await removePendingSubmission(submission.id);
          console.log('✅ Synced test submission:', submission.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync test submission:', submission.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync error:', error);
  }
}

async function syncUserActions() {
  try {
    // Get pending user actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch('/api/user-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        
        if (response.ok) {
          await removePendingAction(action.id);
          console.log('✅ Synced user action:', action.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync user action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync error:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from ExamAce',
    icon: '/logos/icon-192x192.png',
    badge: '/logos/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/logos/action-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logos/action-close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ExamAce', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingSubmissions() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingSubmission(id) {
  // Implementation would use IndexedDB
  console.log('Removed pending submission:', id);
}

async function getPendingActions() {
  // Implementation would use IndexedDB
  return [];
}

async function removePendingAction(id) {
  // Implementation would use IndexedDB
  console.log('Removed pending action:', id);
}

console.log('🚀 Enhanced Service Worker loaded successfully');
