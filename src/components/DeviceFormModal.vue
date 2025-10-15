<template>
  <div class="app-modal-overlay" @click.self="closeModal">
    <div class="app-modal">
      <div class="app-modal-header">
        <h3>{{ isEditMode ? `Edit Device: ${device.name}` : 'Add New Device' }}</h3>
      </div>
      <div class="app-modal-content">
        <!-- Single-column form layout -->
        <div class="app-form-single-column">
          <!-- Common fields for all device types -->
          <div class="app-form-group">
            <label for="deviceName">Name <span class="app-required-field">*</span></label>
            <input type="text" id="deviceName" v-model="device.name" required>
          </div>
          
          <div class="app-form-group">
            <label for="deviceType">Type <span class="app-required-field">*</span></label>
            <select id="deviceType" v-model="device.type" @change="handleTypeChange" required>
              <option value="">Select device type</option>
              <option v-for="type in deviceTypes" :key="type" :value="type">
                {{ type }} - {{ getDeviceTypeInfo(type).label }}
              </option>
            </select>
          </div>
          
          <div class="app-form-group">
            <label for="deviceOwner">Owner <span class="app-required-field">*</span></label>
            <input 
              type="text" 
              id="deviceOwner" 
              v-model="device.owner"
              :disabled="!userIsAdmin"
              class="owner-input"
              :class="{'owner-input-disabled': !userIsAdmin}"
            >
          </div>
          
          <div class="app-form-group">
            <label for="deviceStatus">Status <span class="app-required-field">*</span></label>
            <select id="deviceStatus" v-model="device.status" required>
              <option value="idle">Idle</option>
              <option value="used">Used</option>
              <option value="broken">Broken</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          
          <!-- Attached Server field - only shown when status is "used" -->
          <div class="app-form-group" v-if="device.status === 'used'">
            <label for="attachedServer">Attached Server <span class="app-required-field">*</span></label>
            <select id="attachedServer" v-model="device.attachedServer" required>
              <option value="">Select a server</option>
              <option v-for="server in sortedServersList" :key="server.id" :value="server.id">
                {{ server.name }}
              </option>
            </select>
          </div>
          
          <div class="app-form-group">
            <label for="deviceUsers">Users (comma separated)</label>
            <input type="text" id="deviceUsers" v-model="usersInput" placeholder="user1, user2, user3">
          </div>
          
          <div class="app-form-group">
            <label for="serialNumber">Serial Number (S/N)</label>
            <input type="text" id="serialNumber" v-model="device.serialNumber">
          </div>
          
          <div class="app-form-group">
            <label for="deviceLocation">Location</label>
            <input type="text" id="deviceLocation" v-model="device.location">
          </div>
          
          <div class="app-form-group">
            <label for="deviceNote">Notes</label>
            <textarea id="deviceNote" v-model="device.note" rows="3"></textarea>
          </div>
        </div>
        
        <!-- Dynamic fields based on device type -->
        <div v-if="device.type" class="app-section-divider">
          <h4>{{ device.type }} Specific Information</h4>
          
          <!-- Single-column layout for device-specific fields -->
          <div class="app-form-single-column">
            <!-- NIC specific fields -->
            <template v-if="device.type === 'NIC'">
              <div class="app-form-group">
                <label for="dataRate">Data Rate</label>
                <input type="text" id="dataRate" v-model="device.dataRate">
              </div>
              
              <div class="app-form-group">
                <label for="partNumber">Part Number (P/N)</label>
                <input type="text" id="partNumber" v-model="device.partNumber">
              </div>
              
              <div class="app-form-group">
                <label for="ips">IPs (comma separated)</label>
                <input type="text" id="ips" v-model="ipsInput" placeholder="192.168.1.1, 10.0.0.1">
              </div>
              
              <div class="app-form-group">
                <label for="bmcIp">BMC IP</label>
                <input type="text" id="bmcIp" v-model="device.bmcIp">
              </div>
              
              <div class="app-form-group">
                <label for="oobMac">OOB MAC</label>
                <input type="text" id="oobMac" v-model="device.oobMac">
              </div>
              
              <div class="app-form-group">
                <label for="sudoUser">Sudo Username</label>
                <input type="text" id="sudoUser" v-model="device.sudoUser">
              </div>
              
              <div class="app-form-group">
                <label for="sudoPassword">Sudo Password</label>
                <div class="app-password-container">
                  <input 
                    :type="showSudoPassword ? 'text' : 'password'" 
                    id="sudoPassword" 
                    v-model="device.sudoPassword"
                  >
                  <button 
                    type="button"
                    class="app-password-toggle"
                    @click="showSudoPassword = !showSudoPassword"
                  >
                    <span v-if="showSudoPassword">Hide</span>
                    <span v-else>Show</span>
                  </button>
                </div>
              </div>
              
              <div class="app-form-group">
                <label for="bmcUser">BMC Username</label>
                <input type="text" id="bmcUser" v-model="device.bmcUser">
              </div>
              
              <div class="app-form-group">
                <label for="bmcPassword">BMC Password</label>
                <div class="app-password-container">
                  <input 
                    :type="showBmcPassword ? 'text' : 'password'" 
                    id="bmcPassword" 
                    v-model="device.bmcPassword"
                  >
                  <button 
                    type="button"
                    class="app-password-toggle"
                    @click="showBmcPassword = !showBmcPassword"
                  >
                    <span v-if="showBmcPassword">Hide</span>
                    <span v-else>Show</span>
                  </button>
                </div>
              </div>
              
              <div class="app-form-group">
                <label for="hostMacs">Host MACs (comma separated)</label>
                <input type="text" id="hostMacs" v-model="hostMacsInput" placeholder="00:11:22:33:44:55, 66:77:88:99:AA:BB">
              </div>
              
              <div class="app-form-group">
                <label for="boardId">Board ID</label>
                <input type="text" id="boardId" v-model="device.boardId">
              </div>
            </template>
            
            <!-- FPGA specific fields -->
            <template v-else-if="device.type === 'FPGA' || device.type === 'CXL(FPGA)'">
              <div class="app-form-group">
                <label for="partNumber">Part Number (P/N)</label>
                <input type="text" id="partNumber" v-model="device.partNumber">
              </div>
              
              <div class="app-form-group">
                <label for="mac">MAC</label>
                <input type="text" id="mac" v-model="device.mac">
              </div>
            </template>
            
            <!-- CXL(ASIC) specific fields -->
            <template v-else-if="device.type === 'CXL(ASIC)'">
              <div class="app-form-group">
                <label for="partNumber">Part Number (P/N)</label>
                <input type="text" id="partNumber" v-model="device.partNumber">
              </div>
              
              <div class="app-form-group">
                <label for="capacity">Capacity</label>
                <input type="text" id="capacity" v-model="device.capacity">
              </div>
            </template>
            
            <!-- SSD and GPU specific fields -->
            <template v-else-if="device.type === 'SSD' || device.type === 'GPU'">
              <div class="app-form-group">
                <label for="partNumber">Part Number (P/N)</label>
                <input type="text" id="partNumber" v-model="device.partNumber">
              </div>
              
              <div class="app-form-group">
                <label for="model">Model</label>
                <input type="text" id="model" v-model="device.model">
              </div>
              
              <div class="app-form-group">
                <label for="manufacturer">Manufacturer</label>
                <input type="text" id="manufacturer" v-model="device.manufacturer">
              </div>
              
              <div class="app-form-group" v-if="device.type === 'SSD'">
                <label for="capacity">Capacity</label>
                <input type="text" id="capacity" v-model="device.capacity">
              </div>
            </template>
          </div>
        </div>
      </div>
      
      <div class="app-modal-footer">
        <button @click="saveDevice" class="app-btn app-btn-primary">Save</button>
        <button @click="closeModal" class="app-btn app-btn-secondary">Cancel</button>
        <button 
          v-if="isEditMode" 
          @click="confirmDelete" 
          class="app-btn app-btn-danger"
        >Delete</button>
      </div>
    </div>
  </div>
</template>

<script>
import { firestore, auth } from '@/firebase'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { DEFAULT_DEVICE_TYPE_VALUES, getDeviceTypesList, getDeviceTypeInfo } from '@/utils/deviceFieldConfig'
import { isAdmin as checkIsAdmin, isUser as checkIsUser } from '@/firebase' // Add isUser import
import '@/assets/styles/common/modal-common.css'
import '@/assets/styles/components/DeviceFormModal.css'

export default {
  name: 'DeviceFormModal',
  props: {
    editDevice: {
      type: Object,
      default: null
    },
    serversList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      device: this.getDefaultDevice(),
      originalAttachedServer: null,
      deviceTypes: getDeviceTypesList(),
      showSudoPassword: false,
      showBmcPassword: false,
      usersInput: '',
      ipsInput: '',
      hostMacsInput: '',
      newAttachedServer: null
    }
  },
  computed: {
    isEditMode() {
      return this.editDevice !== null;
    },
    currentUserEmail() {
      return auth.currentUser ? auth.currentUser.email : '';
    },
    currentUsername() {
      if (!this.currentUserEmail) return '';
      return this.currentUserEmail.split('@')[0];
    },
    // Renamed to userIsAdmin to avoid duplicate key error
    userIsAdmin() {
      return checkIsAdmin();
    },
    // Add computed property to check if user is a regular user or admin
    hasEditPermission() {
      return checkIsAdmin() || checkIsUser();
    },

    // Sorted server list (same ordering as ServerList.vue)
    sortedServersList() {
      return [...this.serversList].sort((a, b) => {
        // Get CPU type group indices (lower index = higher priority)
        const groupA = this.getCpuTypeGroupIndex(a.cpuType);
        const groupB = this.getCpuTypeGroupIndex(b.cpuType);

        // If different groups, sort by group
        if (groupA !== groupB) {
          return groupA - groupB;
        }

        // If same group, sort alphabetically by name
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
  },
  watch: {
    editDevice() {
      this.initializeFormData();
    },
    
    // Fixed watcher by combining two implementations
    'device.status': function(newStatus, oldStatus) {
      // If changing from "used" to something else
      if (oldStatus === 'used' && newStatus !== 'used') {
        // Store original server for reference
        this.originalAttachedServer = this.device.attachedServer;
        // Clear the attached server
        this.device.attachedServer = ''; 
      }
    },
    
    // Enhanced watch for attachedServer changes
    'device.attachedServer': function(newServer, oldServer) {
      if (this.isEditMode && newServer !== oldServer) {
        this.newAttachedServer = newServer;
      }
    }
  },
  methods: {
    getDefaultDevice() {
      return {
        name: '',
        type: '',
        owner: this.currentUsername || '',
        status: 'idle',
        attachedServer: '',
        location: '',
        users: [],
        note: '',
        // The specific fields will be added dynamically based on device type
      };
    },
    
    handleTypeChange() {
      // Initialize type-specific fields when type changes
      if (this.device.type && DEFAULT_DEVICE_TYPE_VALUES[this.device.type]) {
        // Preserve the current basic fields
        const { 
          name, type, owner, status, attachedServer, 
          location, users, note 
        } = this.device;
        
        // Add type-specific defaults
        this.device = {
          name, type, owner, status, attachedServer, location, users: users || [], note,
          ...DEFAULT_DEVICE_TYPE_VALUES[this.device.type]
        };
      }
    },
    
    processArrayInputs() {
      const arrayFields = [
        { input: 'usersInput', field: 'users' },
        { input: 'ipsInput', field: 'ips' },
        { input: 'hostMacsInput', field: 'hostMacs' }
      ];
      
      arrayFields.forEach(({ input, field }) => {
        if (this[input]) {
          this.device[field] = this[input].split(',').map(item => item.trim()).filter(Boolean);
        }
      });
    },
    
    validateForm() {
      const requiredFields = [
        { field: 'name', message: 'Device name is required' },
        { field: 'type', message: 'Device type is required' },
        { field: 'owner', message: 'Owner is required' },
        { field: 'status', message: 'Status is required' }
      ];
      
      for (const { field, message } of requiredFields) {
        if (!this.device[field]) {
          alert(message);
          return false;
        }
      }
      
      if (this.device.status === 'used' && !this.device.attachedServer) {
        alert('Attached Server is required when status is Used');
        return false;
      }
      
      return true;
    },
    
    async saveDevice() {
      // Check permissions first
      if (!this.hasEditPermission) {
        alert('You do not have permission to add or edit devices.');
        return;
      }
      
      if (!this.validateForm()) {
        return;
      }
      
      // Process array inputs
      this.processArrayInputs();
      
      // Track server relationship changes
      const oldServer = this.isEditMode ? this.originalAttachedServer : null;
      const newServer = this.device.status === 'used' ? this.device.attachedServer : null;
      
      // Clear attached server if status is not "used"
      if (this.device.status !== 'used') {
        this.device.attachedServer = '';
      }
      
      try {
        const devicesCollection = collection(firestore, 'devices');
        let deviceId;
        
        if (this.isEditMode) {
          // Update existing device
          deviceId = this.editDevice.id;
          const deviceRef = doc(firestore, 'devices', deviceId);
          const { id, ...deviceData } = this.device; // Remove id if present
          console.log("Save device", id);
          await updateDoc(deviceRef, deviceData);
        } else {
          // Create new device
          const docRef = await addDoc(devicesCollection, this.device);
          deviceId = docRef.id;
        }
        
        // Update server relationships if needed
        if (oldServer !== newServer) {
          await this.updateServerAttachment(deviceId, oldServer, newServer);
        }
        
        this.$emit('saved');
        this.closeModal();
      } catch (error) {
        console.error('Error saving device:', error);
        alert(`Error saving device: ${error.message}`);
      }
    },
    
    // Enhanced method to handle both adding and removing from servers
    async updateServerAttachment(deviceId, oldServerId, newServerId) {
      try {
        // Step 1: Remove from old server if needed
        if (oldServerId) {
          await this.updateServerDeviceList(oldServerId, deviceId, false);
        }
        
        // Step 2: Add to new server if needed
        if (newServerId) {
          await this.updateServerDeviceList(newServerId, deviceId, true);
        }
        
        console.log(`Server attachments updated. Device: ${deviceId}`);
      } catch (error) {
        console.error('Error updating server attachments:', error);
      }
    },
    
    // New helper method to update a server's device list
    async updateServerDeviceList(serverId, deviceId, isAdding) {
      try {
        const serverRef = doc(firestore, 'servers', serverId);
        const serverSnap = await getDoc(serverRef);
        
        if (serverSnap.exists()) {
          const serverData = serverSnap.data();
          let attachedDevices = serverData.attachedDevices || [];
          
          if (isAdding) {
            // Add device if not already in list
            if (!attachedDevices.includes(deviceId)) {
              attachedDevices.push(deviceId);
            }
          } else {
            // Remove device from list
            attachedDevices = attachedDevices.filter(id => id !== deviceId);
          }
          
          // Update server document
          await updateDoc(serverRef, { attachedDevices });
          console.log(`Device ${deviceId} ${isAdding ? 'added to' : 'removed from'} server ${serverId}`);
        } else {
          console.warn(`Server ${serverId} not found`);
        }
      } catch (error) {
        console.error(`Error ${isAdding ? 'adding to' : 'removing from'} server:`, error);
        throw error; // Re-throw so the calling function can handle it
      }
    },
    
    async confirmDelete() {
      if (!this.isEditMode || !this.editDevice) return;
      
      // Check permissions first
      if (!this.hasEditPermission) {
        alert('You do not have permission to delete devices.');
        return;
      }
      
      if (confirm(`Are you sure you want to delete device "${this.device.name}"?`)) {
        try {
          // If device is attached to a server, update the server first
          if (this.device.status === 'used' && this.device.attachedServer) {
            await this.updateServerDeviceList(
              this.device.attachedServer, 
              this.editDevice.id, 
              false
            );
          }
          
          // Then delete the device
          const deviceRef = doc(firestore, 'devices', this.editDevice.id);
          await deleteDoc(deviceRef);
          
          this.$emit('deleted');
          this.closeModal();
        } catch (error) {
          console.error('Error deleting device:', error);
          alert(`Error deleting device: ${error.message}`);
        }
      }
    },
    
    closeModal() {
      this.$emit('close');
    },
    
    initializeFormData() {
      if (this.isEditMode && this.editDevice) {
        // Deep clone to avoid modifying props
        this.device = JSON.parse(JSON.stringify(this.editDevice));
        
        // Store the original attached server for possible update later
        this.originalAttachedServer = this.device.attachedServer || null;
        
        // Initialize separated inputs
        this.usersInput = this.device.users ? this.device.users.join(', ') : '';
        this.ipsInput = this.device.ips ? this.device.ips.join(', ') : '';
        this.hostMacsInput = this.device.hostMacs ? this.device.hostMacs.join(', ') : '';
      } else {
        this.device = this.getDefaultDevice();
        this.originalAttachedServer = null;
        this.usersInput = '';
        this.ipsInput = '';
        this.hostMacsInput = '';
      }
    },

    // Helper method to get device type info
    getDeviceTypeInfo(type) {
      return getDeviceTypeInfo(type);
    },

    // CPU type group priority for sorting (same as ServerList.vue)
    getCpuTypeGroupIndex(cpuType) {
      if (!cpuType) return 999;

      const cpuLower = cpuType.toLowerCase();

      if (cpuLower.includes('spr') || cpuLower.includes('emr') || cpuLower.includes('gnr')) return 0;
      if (cpuLower.includes('skx') || cpuLower.includes('icx') || cpuLower.includes('skl')) return 1;
      if (cpuLower.includes('epyc')) return 2;
      if (cpuLower.includes('hsw') || cpuLower.includes('bdw') ||
          cpuLower.includes('haswell') || cpuLower.includes('broadwell')) return 3;

      return 4;
    }
  },
  created() {
    this.initializeFormData();
  }
}
</script>
