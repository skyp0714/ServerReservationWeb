<template>
  <div class="delta-manager">
    <div class="delta-controls">
      <button 
        @click="toggleDeltaUpdates"
        :class="['toggle-btn', deltaStatus.activeListeners > 0 ? 'active' : 'inactive']"
        :disabled="!deltaStatus.isOnline"
      >
        {{ deltaStatus.activeListeners > 0 ? 'Stop' : 'Start' }} Delta Updates
      </button>
      
      <button 
        @click="forceCheckAll"
        class="check-btn"
        :disabled="!deltaStatus.isOnline || isChecking"
      >
        {{ isChecking ? 'Checking...' : 'Check Now' }}
      </button>
    </div>

    <div class="delta-status">
      <div class="status-header">
        <h5>Delta Updates Status</h5>
        <span :class="['status-indicator', deltaStatus.isOnline ? 'online' : 'offline']">
          {{ deltaStatus.isOnline ? '🟢 Online' : '🔴 Offline' }}
        </span>
      </div>

      <div class="status-summary">
        <div class="status-item">
          <span class="label">Active Listeners:</span>
          <span class="value">{{ deltaStatus.activeListeners }}</span>
        </div>
      </div>

      <div v-if="Object.keys(deltaStatus.listeners).length > 0" class="listeners-list">
        <h6>Active Data Types:</h6>
        <div 
          v-for="(listener, dataType) in deltaStatus.listeners" 
          :key="dataType"
          class="listener-item"
        >
          <div class="listener-info">
            <span class="data-type">{{ formatDataType(dataType) }}</span>
            <span class="collection">{{ listener.collectionName }}</span>
          </div>
          <div class="listener-meta">
            <div class="meta-item">
              <span class="meta-label">Last Check:</span>
              <span class="meta-value">{{ formatTime(listener.lastCheck) }}</span>
            </div>
            <div v-if="listener.lastUpdate" class="meta-item">
              <span class="meta-label">Last Update:</span>
              <span class="meta-value">{{ formatTime(listener.lastUpdate) }}</span>
            </div>
            <button 
              @click="forceCheckSingle(dataType)"
              class="force-check-btn"
              :disabled="!deltaStatus.isOnline"
            >
              Check
            </button>
          </div>
        </div>
      </div>

      <div v-else class="no-listeners">
        <p>No delta updates are currently active.</p>
        <p class="help-text">
          Delta updates automatically check for changes to cached data every 5 minutes, 
          reducing Firebase usage while keeping data fresh.
        </p>
      </div>
    </div>

    <div v-if="recentUpdates.length > 0" class="recent-updates">
      <h6>Recent Updates:</h6>
      <div class="updates-list">
        <div 
          v-for="(update, index) in recentUpdates" 
          :key="index"
          class="update-item"
        >
          <span class="update-type">{{ formatDataType(update.dataType) }}</span>
          <span class="update-count">{{ update.count }} items</span>
          <span class="update-time">{{ formatTime(update.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { deltaUpdates } from '@/utils/deltaUpdates'

export default {
  name: 'DeltaUpdatesManager',
  data() {
    return {
      deltaStatus: {
        isOnline: navigator.onLine,
        activeListeners: 0,
        listeners: {}
      },
      recentUpdates: [],
      isChecking: false,
      statusInterval: null
    }
  },
  mounted() {
    this.updateStatus()
    
    // Update status every 10 seconds
    this.statusInterval = setInterval(() => {
      this.updateStatus()
    }, 10000)

    // Listen for delta update events
    window.addEventListener('deltaUpdate', this.handleDeltaUpdate)
  },
  beforeUnmount() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval)
    }
    window.removeEventListener('deltaUpdate', this.handleDeltaUpdate)
  },
  methods: {
    updateStatus() {
      this.deltaStatus = deltaUpdates.getStatus()
    },

    toggleDeltaUpdates() {
      if (this.deltaStatus.activeListeners > 0) {
        // Stop all updates
        deltaUpdates.stopAllUpdates()
      } else {
        // Start updates for common data types
        const dataTypes = ['servers', 'devices', 'users', 'announcements']
        
        dataTypes.forEach(dataType => {
          const collectionName = dataType === 'users' ? 'authorizedUsers' : dataType
          deltaUpdates.startDeltaUpdates(dataType, {
            collectionName,
            batchSize: 20,
            updateInterval: 5 * 60 * 1000 // 5 minutes
          })
        })
      }
      
      // Update status immediately
      setTimeout(() => this.updateStatus(), 100)
    },

    async forceCheckAll() {
      if (!this.deltaStatus.isOnline) return

      this.isChecking = true
      
      try {
        await deltaUpdates.checkAllPendingUpdates()
      } catch (error) {
        console.error('Error force checking all updates:', error)
      }
      
      this.isChecking = false
      this.updateStatus()
    },

    async forceCheckSingle(dataType) {
      if (!this.deltaStatus.isOnline) return

      try {
        await deltaUpdates.forceCheck(dataType)
      } catch (error) {
        console.error(`Error force checking ${dataType}:`, error)
      }
      
      this.updateStatus()
    },

    handleDeltaUpdate(event) {
      const { dataType, updates, timestamp } = event.detail
      
      // Add to recent updates (keep only last 10)
      this.recentUpdates.unshift({
        dataType,
        count: updates.length,
        timestamp: new Date(timestamp)
      })
      
      if (this.recentUpdates.length > 10) {
        this.recentUpdates = this.recentUpdates.slice(0, 10)
      }
    },

    formatDataType(dataType) {
      const labels = {
        servers: 'Servers',
        devices: 'Devices', 
        users: 'Users',
        announcements: 'Announcements'
      }
      return labels[dataType] || dataType
    },

    formatTime(time) {
      if (!time) return 'Never'
      
      const date = time instanceof Date ? time : new Date(time)
      const now = Date.now()
      const diff = now - date.getTime()
      
      if (diff < 60000) return 'Just now'
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
      
      return date.toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.delta-manager {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.delta-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #dc3545;
  color: white;
}

.toggle-btn.active:hover:not(:disabled) {
  background-color: #c82333;
}

.toggle-btn.inactive {
  background-color: #28a745;
  color: white;
}

.toggle-btn.inactive:hover:not(:disabled) {
  background-color: #218838;
}

.toggle-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.check-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.check-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delta-status {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.status-header h5 {
  margin: 0;
  color: #333;
}

.status-indicator {
  font-size: 14px;
  font-weight: 500;
}

.status-indicator.online {
  color: #28a745;
}

.status-indicator.offline {
  color: #dc3545;
}

.status-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.status-item {
  display: flex;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #555;
}

.value {
  color: #333;
}

.listeners-list h6,
.recent-updates h6 {
  margin: 0 0 8px 0;
  color: #555;
}

.listener-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 12px;
  background-color: white;
  border-radius: 4px;
  margin-bottom: 8px;
}

.listener-info .data-type {
  font-weight: 500;
  color: #333;
}

.listener-info .collection {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
}

.listener-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.meta-item {
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.meta-label {
  color: #666;
}

.meta-value {
  color: #333;
}

.force-check-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 4px;
}

.force-check-btn:hover:not(:disabled) {
  background-color: #5a6268;
}

.force-check-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.no-listeners {
  text-align: center;
  color: #666;
}

.help-text {
  font-size: 13px;
  margin-top: 8px;
  line-height: 1.4;
}

.recent-updates {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
}

.updates-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.update-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background-color: white;
  border-radius: 4px;
  font-size: 13px;
}

.update-type {
  font-weight: 500;
  color: #333;
}

.update-count {
  color: #007bff;
}

.update-time {
  color: #666;
}
</style>