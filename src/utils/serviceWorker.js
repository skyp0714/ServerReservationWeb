// Service Worker registration and management
export class ServiceWorkerManager {
  constructor() {
    this.registration = null
    this.isUpdateAvailable = false
  }

  // Register service worker
  async register() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return false
    }

    try {
      this.registration = await navigator.serviceWorker.register('/server-reservation/sw.js', {
        scope: '/server-reservation/'
      })
      
      console.log('Service Worker registered successfully:', this.registration.scope)

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        console.log('Service Worker update found')
        this.handleUpdate()
      })

      // Check if there's a waiting service worker
      if (this.registration.waiting) {
        this.isUpdateAvailable = true
      }

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  // Handle service worker updates
  handleUpdate() {
    const newWorker = this.registration.installing

    if (newWorker) {
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is available
          this.isUpdateAvailable = true
          this.showUpdateNotification()
        }
      })
    }
  }

  // Show update notification to user
  showUpdateNotification() {
    const shouldUpdate = confirm(
      'A new version of the app is available. Would you like to update now?'
    )
    
    if (shouldUpdate) {
      this.activateUpdate()
    }
  }

  // Activate the waiting service worker
  activateUpdate() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Listen for controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  // Clear all caches (for debugging or complete reset)
  async clearAllCaches() {
    if (this.registration) {
      this.registration.waiting?.postMessage({ type: 'CLEAR_CACHE' })
      this.registration.active?.postMessage({ type: 'CLEAR_CACHE' })
    }
    
    // Also clear browser caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('All caches cleared')
    }
  }

  // Check if app can be installed (PWA)
  isInstallable() {
    return this.deferredPrompt !== null
  }

  // Handle install prompt
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later
      this.deferredPrompt = e
      console.log('Install prompt available')
    })

    // Handle successful install
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
      this.deferredPrompt = null
    })
  }

  // Trigger install prompt
  async showInstallPrompt() {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available')
      return false
    }

    // Show the prompt
    this.deferredPrompt.prompt()
    
    // Wait for the user to respond
    const { outcome } = await this.deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)
    
    // Clear the deferredPrompt
    this.deferredPrompt = null
    
    return outcome === 'accepted'
  }
}

// Export singleton instance
export const serviceWorkerManager = new ServiceWorkerManager()