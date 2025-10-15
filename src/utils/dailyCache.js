// Daily Firebase Cache System
// Optimizes Firebase usage by caching non-critical data for 24 hours

import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '@/firebase'

class DailyCache {
  constructor() {
    this.CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    this.CACHE_PREFIX = 'daily_cache_'
  }

  // Generate cache key with date for daily expiry
  getCacheKey(dataType) {
    const today = new Date().toDateString()
    return `${this.CACHE_PREFIX}${dataType}_${today}`
  }

  // Get cached data if available and not expired
  getCachedData(dataType) {
    try {
      const cacheKey = this.getCacheKey(dataType)
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is still valid (within 24 hours)
      if (now - timestamp < this.CACHE_DURATION) {
        console.log(`📦 Using cached ${dataType}:`, data.length, 'items')
        return data
      }

      // Remove expired cache
      localStorage.removeItem(cacheKey)
      return null
    } catch (error) {
      console.error('Error reading cache:', error)
      return null
    }
  }

  // Set data in cache with current timestamp
  setCachedData(dataType, data) {
    try {
      const cacheKey = this.getCacheKey(dataType)
      const cacheData = {
        data,
        timestamp: Date.now(),
        dataType,
        count: data.length
      }
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log(`💾 Cached ${dataType}:`, data.length, 'items for 24h')
    } catch (error) {
      console.error('Error setting cache:', error)
    }
  }

  // Load data with cache-first strategy
  async loadData(dataType, collectionName = null) {
    // Use collection name if provided, otherwise use dataType
    const collection_name = collectionName || dataType

    // Try cache first
    const cached = this.getCachedData(dataType)
    if (cached) {
      return cached
    }

    // Fetch fresh data from Firebase
    try {
      console.log(`🔄 Fetching fresh ${dataType} from Firebase...`)
      const snapshot = await getDocs(collection(firestore, collection_name))
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Cache the fresh data
      this.setCachedData(dataType, data)
      
      return data
    } catch (error) {
      console.error(`Error fetching ${dataType}:`, error)
      return []
    }
  }

  // Force refresh data (ignore cache)
  async refreshData(dataType, collectionName = null) {
    console.log(`🔄 Force refreshing ${dataType}...`)
    
    // Remove existing cache
    const cacheKey = this.getCacheKey(dataType)
    localStorage.removeItem(cacheKey)
    
    // Fetch fresh data
    return this.loadData(dataType, collectionName)
  }

  // Clean up old cache entries (run on app startup)
  cleanupOldCache() {
    try {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          // Check if this is an old cache entry (not today's)
          const today = new Date().toDateString()
          if (!key.includes(today)) {
            keysToRemove.push(key)
          }
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Removed old cache: ${key}`)
      })
      
      console.log(`✅ Cleaned up ${keysToRemove.length} old cache entries`)
    } catch (error) {
      console.error('Error cleaning up cache:', error)
    }
  }

  // Get cache status for debugging
  getCacheStatus() {
    const status = {}
    const dataTypes = ['servers', 'devices', 'users', 'announcements']
    
    dataTypes.forEach(dataType => {
      const cached = this.getCachedData(dataType)
      status[dataType] = {
        cached: !!cached,
        count: cached ? cached.length : 0,
        age: cached ? this.getCacheAge(dataType) : null
      }
    })
    
    return status
  }

  // Get cache age in human readable format
  getCacheAge(dataType) {
    try {
      const cacheKey = this.getCacheKey(dataType)
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) return null

      const { timestamp } = JSON.parse(cached)
      const ageMs = Date.now() - timestamp
      const ageHours = Math.floor(ageMs / (60 * 60 * 1000))
      const ageMinutes = Math.floor((ageMs % (60 * 60 * 1000)) / (60 * 1000))
      
      return `${ageHours}h ${ageMinutes}m ago`
    } catch (error) {
      return null
    }
  }

  // Clear all cache entries (for complete reset)
  clearAllCache() {
    try {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log(`🗑️ Cleared all cache entries: ${keysToRemove.length}`)
      return keysToRemove.length
    } catch (error) {
      console.error('Error clearing all cache:', error)
      return 0
    }
  }
}

// Export singleton instance
export const dailyCache = new DailyCache()
export default dailyCache