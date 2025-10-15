<template>
  <div class="device-list">
    <!-- Home icon button -->
    <router-link to="/home" class="home-icon-button" title="Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </router-link>
    
    <h2>Device List</h2>
    
    <!-- Move ownership toggle before device type tabs -->
    <div class="ownership-toggle-container">
      <div class="app-toggle-buttons-small">
        <button 
          :class="{ active: ownershipFilter === 'all' }" 
          @click="ownershipFilter = 'all'"
        >
          All
        </button>
        <button 
          :class="{ active: ownershipFilter === 'owned' }" 
          @click="ownershipFilter = 'owned'"
        >
          Owned
        </button>
        <button 
          :class="{ active: ownershipFilter === 'used' }" 
          @click="ownershipFilter = 'used'"
        >
          Used
        </button>
      </div>
    </div>
    
    <!-- Device type tabs with fixed device types -->
    <div class="device-tabs">
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        All
      </button>
      <button 
        v-for="type in deviceTypes" 
        :key="type"
        class="tab-button" 
        :class="{ active: activeTab === type.toLowerCase() }"
        @click="activeTab = type.toLowerCase()"
      >
        {{ type }}
      </button>
    </div>
    
    <!-- Filter section using common styles -->
    <div class="filter-container device-filter-container">
      <div class="filter">
        <label for="deviceFilter">Filter devices:</label>
        <input
          type="text"
          id="deviceFilter"
          v-model="deviceFilter"
          placeholder="Device name, type, serial, status, or attached server"
          class="filter-input"
        />
        <button 
          v-if="deviceFilter" 
          class="clear-filter-btn" 
          @click="clearFilter" 
          title="Clear filter"
        >
          ×
        </button>
      </div>
      
      <div class="filter-stats" v-if="deviceFilter || activeTab !== 'all' || ownershipFilter !== 'all'">
        Showing {{ filteredDevices.length }} of {{ devices.length }} devices
      </div>
    </div>
    
    <!-- Use common item-grid class from common-ui.css -->
    <div class="item-grid">
      <div 
        v-for="device in filteredDevices" 
        :key="device.id" 
        class="item-card item-card-with-border"
        :class="[
          getDeviceTypeColorClass(device.type), 
          getStatusBackgroundClass(device.status)
        ]"
      >
        <div class="card-header">
          <div class="name-and-owner">
            <h3>{{ device.name }}</h3>
            <!-- Owner icon next to device name -->
            <span v-if="device.owner" class="owner-indicator" :title="`Owned by: ${device.owner}`">
              <span class="owner-icon">👤</span>
              <span class="owner-name">{{ device.owner }}</span>
            </span>
          </div>
          <div class="status-indicator">
            <span class="status-circle" :class="getStatusColor(device.status)"></span>
            <span class="status-text">{{ formatStatus(device.status) }}</span>
          </div>
          <button class="expand-btn" @click="toggleExpand(device.id)">
            {{ isExpanded(device.id) ? '−' : '+' }}
          </button>
        </div>
        
        <!-- Always show basic info (reduced form) -->
        <div class="reduced-info">
          <!-- Type chip displayed on the right side -->
          <div v-if="device.type" class="type-chip" :class="getDeviceTypeColorClass(device.type)">
            {{ device.type }}
          </div>
          
          <!-- Show attached server as a clickable chip if available -->
          <div v-if="device.attachedServer" class="detail-row">
            <strong>Attached to:</strong>
            <div 
              class="server-chip" 
              :class="getServerCpuColorClass(device.attachedServer)"
              @click="navigateToServer(device.attachedServer)"
              title="Click to see this server in Server List"
            >
              {{ getServerName(device.attachedServer) }}
            </div>
          </div>
          
          <!-- Show users if available -->
          <p v-if="device.users && device.users.length">
            <strong>Users:</strong> {{ formatUsers(device.users) }}
          </p>
        </div>
        
        <!-- Expanded content -->
        <div v-if="isExpanded(device.id)" class="expanded-content">
          <hr>
          
          <!-- Show serial number only if not empty -->
          <div v-if="device.serialNumber" class="detail-row">
            <strong>Serial:</strong> {{ device.serialNumber }}
          </div>
          
          <!-- Show location only if not empty -->
          <div v-if="device.location" class="detail-row">
            <strong>Location:</strong> {{ device.location }}
          </div>
          
          <!-- Show other fields (only if not empty) -->
          <div 
            v-for="(value, key) in getFilteredAdditionalFields(device)" 
            :key="key" 
            class="detail-row"
          >
            <strong>{{ formatFieldName(key) }}:</strong> {{ value }}
          </div>
          
          <!-- Show notes as the last field if available -->
          <div v-if="device.note" class="detail-row note-row">
            <strong>Notes:</strong> 
            <div class="note-content">{{ device.note }}</div>
          </div>
          
          <div class="button-row">
            <button 
              class="action-btn edit-btn" 
              @click="openEditForm(device)" 
              :disabled="!canEditDevice(device)">
              Edit
            </button>
            <button 
              class="action-btn reserve-btn" 
              @click="reserveDevice(device)"
              :disabled="!device.attachedServer">
              Reserve
            </button>
            <button class="action-btn spec-btn" @click="showDeviceDetails(device)">Device Details</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Show message when no devices match filter -->
    <div v-if="(deviceFilter || activeTab !== 'all') && filteredDevices.length === 0" class="no-results">
      <p>No devices match your filter criteria.</p>
      <div class="no-results-actions">
        <button @click="clearFilter" class="clear-filter-button">Clear Text Filter</button>
        <button v-if="activeTab !== 'all'" @click="activeTab = 'all'" class="clear-filter-button">Show All Types</button>
      </div>
    </div>
    
    <!-- Floating add device button -->
    <button 
      v-if="canAddDevice()" 
      class="floating-add-button" 
      @click="openNewDeviceForm"
    >+</button>
    
    <!-- Device Form Modal -->
    <device-form-modal
      v-if="showNewDeviceModal || showEditDeviceModal"
      :edit-device="editingDevice"
      :servers-list="servers"
      @close="closeDeviceForm"
      @saved="handleDeviceSaved"
      @deleted="handleDeviceDeleted"
    />
    
    <!-- Device Details Modal -->
    <div v-if="showDeviceDetailsModal" class="app-modal-overlay" @click.self="closeDeviceDetails">
      <div class="app-modal device-details-modal">
        <div class="app-modal-header">
          <h3>Device Details: {{ activeDevice?.name }}</h3>
        </div>
        <div class="app-modal-content">
          <!-- Type-specific fields -->
          <template v-if="activeDevice?.type">
            <div class="section-divider">{{ activeDevice.type }} Specific Details</div>
            
            <!-- Display all type-specific fields dynamically -->
            <div 
              v-for="field in getTypeSpecificFields(activeDevice.type)" 
              :key="field" 
              class="app-form-group"
            >
              <label>{{ formatFieldName(field) }}</label>
              <div class="info-display">
                <!-- Check if field is a password field -->
                <template v-if="isPasswordField(field)">
                  <!-- Only show passwords to users with permission -->
                  <template v-if="hasViewPermissions()">
                    <span class="password-field">
                      {{ isPasswordVisible(field) ? activeDevice[field] : '••••••••' }}
                      <button 
                        class="toggle-password" 
                        @click="togglePasswordVisibility(field)" 
                        :title="isPasswordVisible(field) ? 'Hide password' : 'Show password'"
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      </button>
                    </span>
                  </template>
                  <template v-else>
                    <span class="password-hidden">[Hidden]</span>
                  </template>
                </template>
                <template v-else-if="activeDevice[field] !== undefined && activeDevice[field] !== null">
                  {{ Array.isArray(activeDevice[field]) ? activeDevice[field].join(', ') : activeDevice[field] }}
                </template>
                <template v-else>N/A</template>
              </div>
            </div>
          </template>
          
          <!-- Additional Properties Section -->
          <div v-if="hasAdditionalProperties">
            <div class="section-divider">Additional Properties</div>
            <div 
              v-for="(value, key) in getAdditionalFields(activeDevice)" 
              :key="key" 
              class="app-form-group"
            >
              <label>{{ formatFieldName(key) }}</label>
              <div class="info-display">{{ value }}</div>
            </div>
          </div>
        </div>
        
        <div class="app-modal-footer">
          <button 
            v-if="activeDevice?.attachedServer" 
            @click="reserveActiveDevice" 
            class="app-btn app-btn-primary"
          >
            Reserve
          </button>
          <button @click="closeDeviceDetails" class="app-btn app-btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, isAdmin, isUser } from '@/firebase' // Add isUser import
import { dailyCache } from '@/utils/dailyCache'
import DeviceFormModal from '@/components/DeviceFormModal.vue'
import { 
  getExcludedFields,
  formatFieldName,
  TYPE_SPECIFIC_FIELDS, // Add this import
  getDeviceTypesList,
  getDeviceTypeInfo
} from '@/utils/deviceFieldConfig'
import '@/assets/styles/common/common-ui.css'
import '@/assets/styles/components/DeviceList.css'

export default {
  name: 'DeviceList',
  components: {
    DeviceFormModal
  },
  data() {
    return {
      devices: [],
      servers: [],
      expandedDevices: new Set(),
      deviceFilter: this.$route.query.filter || '',
      activeTab: 'all',
      showNewDeviceModal: false,
      showEditDeviceModal: false,
      showDeviceDetailsModal: false,
      activeDevice: null,
      editingDevice: null,
      deviceTypes: [],
      ownershipFilter: 'all', // Add the ownership filter property
      visiblePasswords: new Set() // Add this to track visible passwords
    }
  },
  computed: {
    // User info
    currentUserEmail() {
      return auth.currentUser ? auth.currentUser.email : '';
    },
    currentUsername() {
      if (!this.currentUserEmail) return '';
      return this.currentUserEmail.split('@')[0];
    },
    
    // Filter devices based on active tab and search criteria
    filteredDevices() {
      // First filter by device type (tab)
      let result = this.devices;
      
      if (this.activeTab !== 'all') {
        const searchType = this.activeTab.toLowerCase();
        result = result.filter(device => {
          const deviceType = device.type ? device.type.toLowerCase() : '';
          return deviceType === searchType;
        });
      }
      
      // Apply ownership filter
      if (this.ownershipFilter !== 'all') {
        if (this.ownershipFilter === 'owned') {
          // Filter by owned devices
          result = result.filter(device => 
            device.owner && device.owner.toLowerCase() === this.currentUsername.toLowerCase()
          );
        } else if (this.ownershipFilter === 'used') {
          // Filter by devices where user is listed as a user
          result = result.filter(device => 
            device.users && Array.isArray(device.users) && 
            device.users.some(user => user.toLowerCase() === this.currentUsername.toLowerCase())
          );
        }
      }
      
      // Then apply the text filter (only name and attached server)
      if (this.deviceFilter) {
        const filter = this.deviceFilter.toLowerCase().trim();

        result = result.filter(device => {
          // Filter by device name
          const nameMatch = device.name && device.name.toLowerCase().includes(filter);

          // Filter by attached server name
          const serverMatch = device.attachedServer && this.getServerName(device.attachedServer).toLowerCase().includes(filter);

          // Filter by attachedServer field
          const attachedServerMatch = device.attachedServer && device.attachedServer.toLowerCase().includes(filter);

          // Filter by serial number
          const serialMatch = device.serialNumber && device.serialNumber.toLowerCase().includes(filter);

          return nameMatch || serverMatch || attachedServerMatch || serialMatch;
        });
      }
      
      // Sort by: 1) device type, 2) status, 3) name alphabetically
      return result.sort((a, b) => {
        // 1. Get device type indices from the deviceTypes array (case-insensitive)
        const typeA = a.type ? a.type.toUpperCase() : '';
        const typeB = b.type ? b.type.toUpperCase() : '';
        
        const indexA = this.deviceTypes.findIndex(t => t.toUpperCase() === typeA);
        const indexB = this.deviceTypes.findIndex(t => t.toUpperCase() === typeB);
        
        // Use default high index for types not in the deviceTypes array
        const priorityA = indexA !== -1 ? indexA : this.deviceTypes.length;
        const priorityB = indexB !== -1 ? indexB : this.deviceTypes.length;
        
        // Compare type priorities first
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // 2. If types are the same, sort by status (used, idle, broken)
        const statusOrder = { 'used': 0, 'idle': 1, 'broken': 2 };
        const statusA = a.status ? a.status.toLowerCase() : 'unknown';
        const statusB = b.status ? b.status.toLowerCase() : 'unknown';
        
        const statusPriorityA = statusOrder[statusA] !== undefined ? statusOrder[statusA] : 999;
        const statusPriorityB = statusOrder[statusB] !== undefined ? statusOrder[statusB] : 999;
        
        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB;
        }
        
        // 3. If status is also the same, sort by name alphabetically
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    },
    
    // Check if device has additional properties to display
    hasAdditionalProperties() {
      return this.activeDevice && Object.keys(this.getAdditionalFields(this.activeDevice)).length > 0;
    }
  },
  methods: {
    // Create default device object
    getDefaultDeviceObject() {
      return {
        name: '',
        type: '',
        serialNumber: '',
        owner: this.currentUsername,
        status: 'idle',
        model: '',
        manufacturer: '',
        purchasedDate: '',
        location: ''
      };
    },
    
    // Get CSS class for device based on type
    getDeviceTypeColorClass(type) {
      if (!type) return 'type-default';
      
      const typeLower = type.toLowerCase();
      
      if (typeLower.includes('nic')) return 'type-blue';
      if (typeLower.includes('ssd')) return 'type-green';
      if (typeLower.includes('fpga')) return 'type-orange';
      if (typeLower.includes('gpu')) return 'type-red';
      if (typeLower.includes('cxl')) return 'type-purple';
      
      return 'type-default';
    },
    
    // Get status color class
    getStatusColor(status) {
      if (!status) return 'status-red';
      status = status.toLowerCase();
      return (status === 'used' || status === 'idle') ? 'status-green' : 'status-red';
    },
    
    // Get background class based on status
    getStatusBackgroundClass(status) {
      if (!status) return 'bg-inactive';
      status = status.toLowerCase();
      if (status === 'used') return 'bg-active';
      return 'bg-inactive';
    },
    
    // Format status for display
    formatStatus(status) {
      if (!status) return 'Unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
    
    // Device expansion
    toggleExpand(deviceId) {
      if (this.expandedDevices.has(deviceId)) {
        this.expandedDevices.delete(deviceId);
      } else {
        this.expandedDevices.add(deviceId);
      }
    },
    
    isExpanded(deviceId) {
      return this.expandedDevices.has(deviceId);
    },
    
    // Get additional fields for display
    getFilteredAdditionalFields(device) {
      if (!device) return {};
      
      const excludeFields = getExcludedFields(device.type);
      
      return Object.fromEntries(
        Object.entries(device).filter(([key, value]) => 
          !excludeFields.includes(key) && 
          key !== 'note' &&
          value !== null && 
          value !== undefined && 
          value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !key.toLowerCase().includes('transfer')
        )
      );
    },
    
    getAdditionalFields(device) {
      if (!device) return {};
      
      const excludeFields = getExcludedFields(device.type);
      
      return Object.fromEntries(
        Object.entries(device).filter(([key, value]) => 
          !excludeFields.includes(key) && 
          value !== null && 
          value !== undefined && 
          value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !key.toLowerCase().includes('transfer')
        )
      );
    },
    
    // Device details modal
    showDeviceDetails(device) {
      this.activeDevice = JSON.parse(JSON.stringify(device));
      this.showDeviceDetailsModal = true;
    },
    
    closeDeviceDetails() {
      this.showDeviceDetailsModal = false;
      this.activeDevice = null;
    },
    
    // Reserve active device
    reserveActiveDevice() {
      if (this.activeDevice && this.activeDevice.attachedServer) {
        const server = this.servers.find(s => s.id === this.activeDevice.attachedServer);
        if (server) {
          this.$router.push({
            path: '/calendar',
            query: { device: this.activeDevice.name }
          });
        }
        this.closeDeviceDetails();
      }
    },
    
    // Filter management
    clearFilter() {
      this.deviceFilter = '';
      
      if (this.$route.query.filter) {
        const newQuery = { ...this.$route.query };
        delete newQuery.filter;
        
        this.$router.replace({
          query: Object.keys(newQuery).length ? newQuery : undefined
        });
      }
    },
    
    clearTabFilter() {
      this.activeTab = 'all';
    },
    
    clearAllFilters() {
      this.clearFilter();
      this.clearTabFilter();
    },
    
    // Permission checks
    canEditDevice(device) {
      if (isAdmin()) return true;
      
      if (isUser()) {
        if (!device.owner || !this.currentUsername) return false;
        return device.owner.toLowerCase() === this.currentUsername.toLowerCase();
      }
      
      return false;
    },
    
    canAddDevice() {
      return isAdmin() || isUser();
    },
    
    // Form management
    openNewDeviceForm() {
      if (!this.canAddDevice()) {
        alert('You need to sign in with an account that has permission to add devices.');
        return;
      }
      
      this.editingDevice = null;
      this.showNewDeviceModal = true;
    },
    
    openEditForm(device) {
      if (!this.canEditDevice(device)) {
        if (!isUser() && !isAdmin()) {
          alert('You need to sign in to edit devices.');
        } else {
          alert('Only the owner can edit this device.');
        }
        return;
      }
      
      this.editingDevice = JSON.parse(JSON.stringify(device));
      this.showEditDeviceModal = true;
    },
    
    closeDeviceForm() {
      this.showNewDeviceModal = false;
      this.showEditDeviceModal = false;
      this.editingDevice = null;
    },
    
    async handleDeviceSaved() {
      console.log('Device saved successfully');
      await this.refreshDeviceCache();
      this.closeDeviceForm();
    },
    
    async handleDeviceDeleted() {
      console.log('Device deleted successfully');
      await this.refreshDeviceCache();
      this.closeDeviceForm();
    },
    
    // Reserve device
    reserveDevice(device) {
      if (device.attachedServer) {
        const server = this.servers.find(s => s.id === device.attachedServer);
        if (server) {
          this.$router.push({
            path: '/calendar',
            query: { device: device.name }
          });
          return;
        }
      }
      
      alert('This device is not attached to any server. Please attach it to a server first to make a reservation.');
    },
    
    // State management
    resetState() {
      this.deviceFilter = this.$route.query.filter || '';
      this.activeTab = 'all';
      this.closeModals();
      
      if (this.$route.query.ownershipFilter) {
        this.ownershipFilter = this.$route.query.ownershipFilter;
      }

      this.visiblePasswords.clear();
    },
    
    closeModals() {
      this.showNewDeviceModal = false;
      this.showEditDeviceModal = false;
      this.showDeviceDetailsModal = false;
      this.activeDevice = null;
      this.editingDevice = null;
    },
    
    formatUsers(users) {
      if (!users || !Array.isArray(users)) return 'None';
      return users.join(', ');
    },
    
    // Get server name by ID
    getServerName(serverId) {
      const server = this.servers.find(s => s.id === serverId);
      return server ? server.name : 'Unknown Server';
    },
    
    // Get server CPU type color class
    getServerCpuColorClass(serverId) {
      const server = this.servers.find(s => s.id === serverId);
      if (!server || !server.cpuType) return 'cpu-default';
      
      const cpuLower = server.cpuType.toLowerCase();
      
      // Use the same color scheme as in ServerList.vue
      if (cpuLower.includes('skx') || cpuLower.includes('icx') || cpuLower.includes('skl')) return 'cpu-blue';
      if (cpuLower.includes('spr') || cpuLower.includes('emr') || cpuLower.includes('gnr')) return 'cpu-green';
      if (cpuLower.includes('hsw') || cpuLower.includes('bdw') || cpuLower.includes('haswell') || cpuLower.includes('broadwell')) return 'cpu-orange';
      if (cpuLower.includes('epyc')) return 'cpu-purple';
      
      return 'cpu-default';
    },
    
    // Navigate to server list with filter
    navigateToServer(serverId) {
      const server = this.servers.find(s => s.id === serverId);
      if (server && server.name) {
        this.$router.push({
          path: '/servers',
          query: { filter: server.name }
        });
      }
    },
    
    formatFieldName,
    
    getTypeSpecificFields(deviceType) {
      return deviceType && TYPE_SPECIFIC_FIELDS[deviceType] 
        ? TYPE_SPECIFIC_FIELDS[deviceType]
        : [];
    },

    // Password visibility management
    isPasswordField(fieldName) {
      return fieldName.toLowerCase().includes('password');
    },
    
    isPasswordVisible(field) {
      return this.visiblePasswords.has(field);
    },
    
    togglePasswordVisibility(field) {
      if (this.visiblePasswords.has(field)) {
        this.visiblePasswords.delete(field);
      } else {
        this.visiblePasswords.add(field);
        setTimeout(() => {
          this.visiblePasswords.delete(field);
          this.$forceUpdate();
        }, 5000);
      }
    },
    
    hasViewPermissions() {
      return isAdmin() || isUser();
    },

    // Helper method to get device type info
    getDeviceTypeInfo(type) {
      return getDeviceTypeInfo(type);
    },

    // Load devices using daily cache
    async loadDevices() {
      try {
        this.devices = await dailyCache.loadData('devices');
        console.log('Loaded devices:', this.devices.length);
      } catch (error) {
        console.error('Error loading devices:', error);
        this.devices = [];
      }
    },

    // Load servers using daily cache
    async loadServers() {
      try {
        this.servers = await dailyCache.loadData('servers');
        console.log('Loaded servers:', this.servers.length);
      } catch (error) {
        console.error('Error loading servers:', error);
        this.servers = [];
      }
    },

    // Refresh device cache after changes
    async refreshDeviceCache() {
      try {
        this.devices = await dailyCache.refreshData('devices');
        this.servers = await dailyCache.refreshData('servers');
        console.log('Cache refreshed - Devices:', this.devices.length, 'Servers:', this.servers.length);
      } catch (error) {
        console.error('Error refreshing cache:', error);
      }
    }
  },
  beforeRouteLeave(to, from, next) {
    this.closeModals();
    next();
  },
  
  activated() {
    this.resetState();
  },
  
  mounted() {
    this.resetState();
  },
  created() {
    // Initialize device types
    this.deviceTypes = getDeviceTypesList();
    
    // Load data using daily cache
    this.loadDevices();
    this.loadServers();
    
    if (this.$route.query.ownershipFilter) {
      this.ownershipFilter = this.$route.query.ownershipFilter;
    }
  },
  watch: {
    '$route.query.filter'(newFilter) {
      if (newFilter !== undefined) {
        this.deviceFilter = newFilter;
      }
    },
    
    '$route.query.ownershipFilter'(newFilter) {
      if (newFilter) {
        this.ownershipFilter = newFilter;
      }
    }
  }
}
</script>

<!-- DeviceList component styles moved to /src/assets/styles/components/DeviceList.css -->