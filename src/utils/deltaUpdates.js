// Delta Updates System
// Implements incremental updates for cached data to minimize Firebase reads

import { firestore } from '@/firebase'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { dailyCache } from './dailyCache'

class DeltaUpdates {
  constructor() {
    this.listeners = new Map() // Track active listeners
    this.lastUpdateTimes = new Map() // Track last update timestamps
    this.UPDATE_INTERVAL = 5 * 60 * 1000 // Check for updates every 5 minutes
    this.isOnline = navigator.onLine
    this.setupNetworkListeners()
  }

  // Setup network status listeners
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online - checking for updates')
      this.isOnline = true
      this.checkAllPendingUpdates()
    })

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline - using cached data only')
      this.isOnline = false
    })
  }

  // Start delta updates for a specific data type
  startDeltaUpdates(dataType, options = {}) {
    if (!this.isOnline) {
      console.log(`📴 Offline - skipping delta updates for ${dataType}`)
      return
    }

    const {
      collectionName = dataType,
      batchSize = 10,
      updateInterval = this.UPDATE_INTERVAL
    } = options

    // Stop existing listener if any
    this.stopDeltaUpdates(dataType)

    console.log(`🔄 Starting delta updates for ${dataType}`)

    // Set initial last update time to 1 hour ago to catch recent changes
    const initialTime = new Date(Date.now() - (60 * 60 * 1000))
    this.lastUpdateTimes.set(dataType, initialTime)

    // Create periodic update checker
    const intervalId = setInterval(() => {
      this.checkForUpdates(dataType, collectionName, batchSize)
    }, updateInterval)

    // Store listener info
    this.listeners.set(dataType, {
      intervalId,
      collectionName,
      batchSize,
      lastCheck: Date.now()
    })

    // Do initial check
    this.checkForUpdates(dataType, collectionName, batchSize)
  }

  // Check for updates since last update time
  async checkForUpdates(dataType, collectionName, batchSize) {
    if (!this.isOnline) return

    try {
      const lastUpdate = this.lastUpdateTimes.get(dataType)
      if (!lastUpdate) return

      console.log(`🔍 Checking for ${dataType} updates since:`, lastUpdate)

      // Query for documents updated since last check
      // Note: This requires 'updatedAt' field in documents
      const updatesQuery = query(
        collection(firestore, collectionName),
        where('updatedAt', '>', Timestamp.fromDate(lastUpdate)),
        orderBy('updatedAt', 'desc'),
        limit(batchSize)
      )

      const snapshot = await getDocs(updatesQuery)
      
      if (snapshot.empty) {
        console.log(`✅ No updates found for ${dataType}`)
        return
      }

      console.log(`📦 Found ${snapshot.docs.length} updates for ${dataType}`)

      // Process updates
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _deltaUpdate: true // Mark as delta update
      }))

      // Apply updates to cache
      await this.applyDeltaUpdates(dataType, updates)

      // Update last update time
      const latestUpdate = snapshot.docs[0].data().updatedAt.toDate()
      this.lastUpdateTimes.set(dataType, latestUpdate)

    } catch (error) {
      // If updatedAt field doesn't exist, fall back to full refresh
      if (error.code === 'failed-precondition' || error.code === 'invalid-argument') {
        console.log(`⚠️ ${dataType} collection doesn't support delta updates - using full refresh`)
        this.fallbackToFullRefresh(dataType, collectionName)
      } else {
        console.error(`Error checking for ${dataType} updates:`, error)
      }
    }
  }

  // Apply delta updates to cached data
  async applyDeltaUpdates(dataType, updates) {
    try {
      // Get current cached data
      let cachedData = dailyCache.getCachedData(dataType) || []
      let hasChanges = false

      for (const update of updates) {
        const existingIndex = cachedData.findIndex(item => item.id === update.id)
        
        if (existingIndex >= 0) {
          // Update existing item
          if (this.hasItemChanged(cachedData[existingIndex], update)) {
            cachedData[existingIndex] = { ...update }
            hasChanges = true
            console.log(`📝 Updated ${dataType} item:`, update.id)
          }
        } else {
          // Add new item
          cachedData.push(update)
          hasChanges = true
          console.log(`➕ Added new ${dataType} item:`, update.id)
        }
      }

      // Update cache if there were changes
      if (hasChanges) {
        dailyCache.setCachedData(dataType, cachedData)
        console.log(`💾 Applied ${updates.length} delta updates to ${dataType} cache`)
        
        // Emit custom event for UI updates
        this.emitUpdateEvent(dataType, updates)
      }

    } catch (error) {
      console.error(`Error applying delta updates for ${dataType}:`, error)
    }
  }

  // Check if item has actually changed (deep comparison of key fields)
  hasItemChanged(oldItem, newItem) {
    // Compare key fields that matter for UI updates
    const keyFields = ['name', 'status', 'owner', 'type', 'updatedAt', 'isActive']
    
    return keyFields.some(field => {
      const oldValue = oldItem[field]
      const newValue = newItem[field]
      
      // Handle Timestamp objects
      if (oldValue instanceof Timestamp && newValue instanceof Timestamp) {
        return oldValue.seconds !== newValue.seconds
      }
      
      return oldValue !== newValue
    })
  }

  // Fallback to full refresh when delta updates aren't supported
  async fallbackToFullRefresh(dataType, collectionName) {
    console.log(`🔄 Falling back to full refresh for ${dataType}`)
    
    try {
      // Force refresh cache
      await dailyCache.refreshData(dataType, collectionName)
      
      // Set last update time to now
      this.lastUpdateTimes.set(dataType, new Date())
      
    } catch (error) {
      console.error(`Error in fallback refresh for ${dataType}:`, error)
    }
  }

  // Stop delta updates for a data type
  stopDeltaUpdates(dataType) {
    const listener = this.listeners.get(dataType)
    if (listener) {
      clearInterval(listener.intervalId)
      this.listeners.delete(dataType)
      console.log(`⏹️ Stopped delta updates for ${dataType}`)
    }
  }

  // Stop all delta updates
  stopAllUpdates() {
    for (const [dataType] of this.listeners) {
      this.stopDeltaUpdates(dataType)
    }
    console.log('⏹️ Stopped all delta updates')
  }

  // Check all pending updates (called when coming back online)
  async checkAllPendingUpdates() {
    if (!this.isOnline) return

    console.log('🔄 Checking all pending updates after reconnect')
    
    for (const [dataType, listener] of this.listeners) {
      await this.checkForUpdates(dataType, listener.collectionName, listener.batchSize)
    }
  }

  // Emit custom event for UI components to listen to
  emitUpdateEvent(dataType, updates) {
    const event = new CustomEvent('deltaUpdate', {
      detail: {
        dataType,
        updates,
        timestamp: Date.now()
      }
    })
    
    window.dispatchEvent(event)
  }

  // Get status of all delta update listeners
  getStatus() {
    const status = {
      isOnline: this.isOnline,
      activeListeners: this.listeners.size,
      listeners: {}
    }

    for (const [dataType, listener] of this.listeners) {
      const lastUpdate = this.lastUpdateTimes.get(dataType)
      status.listeners[dataType] = {
        collectionName: listener.collectionName,
        batchSize: listener.batchSize,
        lastCheck: new Date(listener.lastCheck),
        lastUpdate: lastUpdate ? lastUpdate : null,
        isActive: true
      }
    }

    return status
  }

  // Force check for specific data type
  async forceCheck(dataType) {
    const listener = this.listeners.get(dataType)
    if (listener) {
      console.log(`🔄 Force checking updates for ${dataType}`)
      await this.checkForUpdates(dataType, listener.collectionName, listener.batchSize)
    }
  }
}

// Export singleton instance
export const deltaUpdates = new DeltaUpdates()
export default deltaUpdates