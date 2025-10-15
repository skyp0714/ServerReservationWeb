// Service Worker for PWA caching
const CACHE_NAME = 'server-reservation-v1.0'
const STATIC_CACHE_NAME = 'static-v1.0'

// Cache static assets for offline functionality
const STATIC_ASSETS = [
  '/server-reservation/',
  '/server-reservation/index.html',
  '/server-reservation/manifest.json',
  '/server-reservation/favicon.ico',
  '/server-reservation/manual.pdf'
]

// API responses that should be cached
const CACHEABLE_APIS = [
  '/api/servers',
  '/api/devices',
  '/api/announcements',
  '/api/bugs',
  '/api/users'
]

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // Handle Firebase API requests with network-first strategy
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('firebase')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
      url.pathname.startsWith('/server-reservation/js/') || 
      url.pathname.startsWith('/server-reservation/css/') ||
      url.pathname.startsWith('/server-reservation/img/')) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Handle HTML pages with network-first strategy
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Default: try network first, fallback to cache
  event.respondWith(networkFirstStrategy(request))
})

// Network-first strategy: try network, fallback to cache
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    
    // Fallback to cache
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // If no cache available, return offline page or error
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Offline - Server Reservation</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="location.reload()">Try Again</button>
          </div>
        </body>
        </html>`,
        {
          status: 200,
          headers: { 'Content-Type': 'text/html' }
        }
      )
    }
    
    throw error
  }
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirstStrategy(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Cache-first strategy failed:', request.url, error)
    throw error
  }
}

// Message handling for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      })
    )
  }
})