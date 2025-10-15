<template>
  <div class="cache-manager">
    <button 
      @click="clearAllCaches"
      class="clear-cache-btn"
      :disabled="isClearing"
      title="Clear all cached data and refresh from server"
    >
      {{ isClearing ? 'Clearing...' : 'Clear Cache' }}
    </button>
    
    <div v-if="showStatus" class="cache-status">
      <p>{{ statusMessage }}</p>
    </div>
  </div>
</template>

<script>
import { serviceWorkerManager } from '@/utils/serviceWorker'
import { dailyCache } from '@/utils/dailyCache'

export default {
  name: 'CacheManager',
  data() {
    return {
      isClearing: false,
      showStatus: false,
      statusMessage: ''
    }
  },
  methods: {
    async clearAllCaches() {
      this.isClearing = true
      this.showStatus = true
      
      try {
        this.statusMessage = 'Clearing localStorage cache...'
        
        // Clear daily cache (localStorage)
        dailyCache.clearAllCache()
        
        this.statusMessage = 'Clearing service worker cache...'
        
        // Clear service worker caches
        await serviceWorkerManager.clearAllCaches()
        
        this.statusMessage = 'Cache cleared successfully! Refreshing page...'
        
        // Wait a moment for user to see the message
        setTimeout(() => {
          window.location.reload()
        }, 1000)
        
      } catch (error) {
        console.error('Error clearing caches:', error)
        this.statusMessage = 'Error clearing cache. Please refresh manually.'
        
        setTimeout(() => {
          this.showStatus = false
        }, 3000)
      }
      
      this.isClearing = false
    }
  }
}
</script>

<style scoped>
.cache-manager {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.clear-cache-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.clear-cache-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

.clear-cache-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cache-status {
  text-align: center;
  margin-top: 10px;
}

.cache-status p {
  margin: 0;
  font-size: 14px;
  color: #666;
}
</style>