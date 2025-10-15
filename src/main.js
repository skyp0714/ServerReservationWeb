// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'  // This now uses the simple reactive store
import { serviceWorkerManager } from './utils/serviceWorker'
import { deltaUpdates } from './utils/deltaUpdates'
import { dailyCache } from './utils/dailyCache'
import { auth } from './firebase'

// Import global styles
import './assets/styles/common/common-ui.css'
import './assets/styles/common/modal-styles.css'
import './assets/styles/dark-mode.css'

const app = createApp(App)

// Add the store to the global properties so it can be accessed anywhere
app.config.globalProperties.$store = store

// Initialize cache system
dailyCache.cleanupOldCache()

// Register service worker (production only)
if (process.env.NODE_ENV === 'production') {
  serviceWorkerManager.register()
  serviceWorkerManager.setupInstallPrompt()
}

// Initialize delta updates for authenticated users only
if (process.env.NODE_ENV === 'production') {
  // Wait for auth state and start delta updates only for authenticated users
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is authenticated, start delta updates
      setTimeout(() => {
        const dataTypes = ['servers', 'devices', 'users', 'announcements']
        dataTypes.forEach(dataType => {
          const collectionName = dataType === 'users' ? 'authorizedUsers' : dataType
          deltaUpdates.startDeltaUpdates(dataType, {
            collectionName,
            batchSize: 20,
            updateInterval: 5 * 60 * 1000 // 5 minutes
          })
        })
      }, 2000) // Start after 2 seconds to let app initialize
    } else {
      // User is not authenticated, stop any running delta updates
      deltaUpdates.stopAllUpdates()
    }
  })
}

// Mount with router
app.use(router)
   .mount('#app')