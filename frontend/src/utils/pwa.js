// src/utils/pwa.js
/**
 * PWA Registration + Install Prompt Handler
 * Call registerSW() in main.jsx to enable PWA functionality.
 */

let deferredPrompt = null

/**
 * Register the service worker and capture the install prompt.
 */
export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported')
    return
  }

  // In development mode, unregister any active service worker to avoid caching conflicts with Vite HMR
  if (import.meta.env.DEV) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    for (const registration of registrations) {
      await registration.unregister()
      console.log('[PWA] Unregistered service worker in dev mode')
    }
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    console.log('[PWA] Service worker registered:', registration.scope)

    // Force update check on page load
    registration.update()

    // Automatically reload when a new service worker takes control
    let refreshing = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true
        console.log('[PWA] New version active! Reloading page...')
        window.location.reload()
      }
    })

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] New version available! Activating...')
            newWorker.postMessage({ type: 'SKIP_WAITING' })
          }
        })
      }
    })
  } catch (err) {
    console.warn('[PWA] Service worker registration failed:', err)
  }
}

/**
 * Listen for the beforeinstallprompt event and save it for later.
 * Call showInstallPrompt() when the user wants to install.
 */
export function initInstallPrompt(onReady) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    if (onReady) onReady(e)
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    console.log('[PWA] App installed successfully')
  })
}

/**
 * Show the native browser install prompt.
 * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
 */
export async function showInstallPrompt() {
  if (!deferredPrompt) return 'unavailable'
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  return outcome
}

/**
 * Check if app is already installed (running in standalone mode).
 */
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
}
