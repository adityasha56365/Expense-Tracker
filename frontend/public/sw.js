// public/sw.js — Service Worker for PWA offline support & auto-update
const CACHE_NAME = 'smart-expense-tracker-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
]

// ── Install: cache static assets and skip waiting immediately ─────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail if some assets aren't available
      })
    })
  )
  self.skipWaiting()
})

// ── Activate: clean up old caches & claim clients immediately ────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Listen for skip waiting message ─────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// ── Fetch: Network-First for HTML/Navigation & API, Network-First with Cache Fallback for Assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests or development server (localhost / 127.0.0.1)
  if (request.method !== 'GET') return
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return

  // 1. API calls: Network-first, fallback to cache when offline
  if (url.pathname.startsWith('/api/') || url.port === '8000') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // 2. Navigation / HTML requests: Network-First
  // Guarantees users always fetch the latest deployed index.html from Vercel!
  if (request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
          }
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    )
    return
  }

  // 3. Static assets & scripts: Network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// ── Background Sync: offline transaction creation ───────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions())
  }
})

async function syncPendingTransactions() {
  console.log('[SW] Background sync triggered')
}

// ── Push Notifications ───────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  const options = {
    body: data.body || 'You have a new financial alert',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Smart Expense Tracker', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action !== 'dismiss') {
    event.waitUntil(
      clients.openWindow(event.notification.data?.url || '/')
    )
  }
})
