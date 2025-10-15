<template>
  <div class="server-list">
    <!-- Home icon button using common styles -->
    <router-link to="/home" class="home-icon-button" title="Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </router-link>
    
    <h2>Server List</h2>
    
    <!-- Add ownership toggle -->
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
          v-if="currentUserEmail"
          :class="{ active: ownershipFilter === 'favorite' }" 
          @click="ownershipFilter = 'favorite'"
        >
          Favorites
        </button>
      </div>
    </div>
    
    <!-- Server filter using common styles -->
    <div class="filter-container">
      <div class="filter">
        <label for="serverFilter">Filter servers:</label>
        <input
          type="text"
          id="serverFilter"
          v-model="serverFilter"
          placeholder="Server name, CPU type, or attached device (name/serial)"
          class="filter-input"
        />
        <button 
          v-if="serverFilter" 
          class="clear-filter-btn" 
          @click="clearFilter" 
          title="Clear filter"
        >
          ×
        </button>
      </div>
      <div class="filter-stats" v-if="serverFilter">
        Showing {{ filteredServers.length }} of {{ servers.length }} servers
      </div>
    </div>
    
    <!-- Server grid using unified item-grid styles -->
    <div class="item-grid">
      <div 
        v-for="server in filteredServers" 
        :key="server.id" 
        class="item-card item-card-with-border"
        :class="[
          getCpuColorClass(server.cpuType), 
          getStatusColor(server.status) === 'status-red' ? 'unusable-server' : ''
        ]"
      >
        <div class="card-header">
          <div class="name-and-owner">
            <h3>{{ server.name }}</h3>
            <!-- Owner icon next to server name -->
            <span v-if="server.owner" class="owner-indicator" :title="`Owned by: ${server.owner}`">
              <span class="owner-icon">👤</span>
              <span class="owner-name">{{ server.owner }}</span>
            </span>
          </div>
          <!-- Update to include the favorite star button -->
          <div class="status-container">
            <!-- Add favorite button for logged-in users -->
            <button 
              v-if="currentUserEmail"
              @click.stop="toggleFavorite(server.id)" 
              class="favorite-btn"
              :class="{ 'is-favorite': isServerFavorite(server.id) }"
              :title="isServerFavorite(server.id) ? 'Remove from favorites' : 'Add to favorites'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path :fill="isServerFavorite(server.id) ? 'currentColor' : 'none'" 
                      :stroke="isServerFavorite(server.id) ? 'none' : 'currentColor'"
                      stroke-width="1.5"
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </button>
            <div class="status-indicator">
              <span class="status-circle" :class="getStatusColor(server.status)"></span>
              <span class="status-text">{{ formatStatus(server.status) }}</span>
            </div>
          </div>
          <button class="expand-btn" @click="toggleExpand(server.id)">
            {{ isExpanded(server.id) ? '−' : '+' }}
          </button>
        </div>
        
        <!-- Always show basic info -->
        <p v-if="server.cpuType"><strong>CPU:</strong> {{ server.cpuType }}</p>
        <p v-if="server.ip"><strong>IP:</strong> {{ formatIp(server.ip) }}</p>
        <p v-if="server.location"><strong>Location:</strong> {{ server.location }}</p>
        
        <!-- Expanded content -->
        <div v-if="isExpanded(server.id)" class="expanded-content">
          <hr>
          
          <!-- Show sudo username if available -->
          <div v-if="server.sudoUser" class="detail-row">
            <strong>Sudo Username:</strong> {{ server.sudoUser }}
          </div>
          
          <!-- Show sudo password (masked) if available - only for admin/normal users -->
          <div v-if="server.sudoUserPassword && hasViewPermissions()" class="detail-row">
            <strong>Sudo Password:</strong> 
            <span class="password-field">
              {{ isSudoPasswordVisible(server.id) ? server.sudoUserPassword : '••••••••' }}
              <button 
                class="toggle-password" 
                @click="toggleSudoPassword(server.id)" 
                :title="isSudoPasswordVisible(server.id) ? 'Hide sudo password' : 'Show sudo password'"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </span>
          </div>
          
          <!-- Show BMC IP if available -->
          <div v-if="server.bmcIp" class="detail-row">
            <strong>BMC IP:</strong>
            <span class="bmc-links-container">
              <a
                v-for="(ip, index) in parseBmcIps(server.bmcIp)"
                :key="index"
                :href="`https://${ip}`"
                target="_blank"
                rel="noopener noreferrer"
                class="bmc-link"
              >
                {{ ip }}
              </a>
            </span>
          </div>
          
          <!-- Show BMC username if available -->
          <div v-if="server.bmcUser" class="detail-row">
            <strong>BMC Username:</strong> {{ server.bmcUser }}
          </div>
          
          <!-- Show BMC password (masked) if available - only for admin/normal users -->
          <div v-if="server.bmcPassword && hasViewPermissions()" class="detail-row">
            <strong>BMC Password:</strong> 
            <span class="password-field">
              {{ isBmcPasswordVisible(server.id) ? server.bmcPassword : '••••••••' }}
              <button 
                class="toggle-password" 
                @click="toggleBmcPassword(server.id)" 
                :title="isBmcPasswordVisible(server.id) ? 'Hide BMC password' : 'Show BMC password'"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </span>
          </div>
          
          <!-- Show Ubuntu version if available -->
          <div v-if="server.ubuntuVersion" class="detail-row">
            <strong>Ubuntu Version:</strong> {{ server.ubuntuVersion }}
          </div>
          
          <!-- Show note if available - updated with truncation and expansion capability -->
          <div v-if="server.note" class="detail-row">
            <strong>Note:</strong>
            <div
              class="note-content"
              :class="{ 'truncated': !expandedNotes.has(server.id), 'expanded': expandedNotes.has(server.id) }"
              @click="handleNoteClick($event, server.id)"
              v-html="linkifyText(server.note)"
            >
            </div>
            <div class="note-expand-indicator" v-if="isNoteTruncated(server.note)">
              {{ expandedNotes.has(server.id) ? '(Click to collapse)' : '(Click to expand)' }}
            </div>
          </div>
          
          <!-- Show attached devices if available -->
          <div v-if="server.attachedDevices && server.attachedDevices.length" class="detail-row">
            <strong>Attached Devices:</strong>
            <div class="attached-devices-chips">
              <div 
                v-for="deviceId in server.attachedDevices" 
                :key="deviceId" 
                class="device-chip clickable-chip"
                :class="getDeviceTypeColorClass(deviceId)"
                @click="navigateToDevice(deviceId)"
                title="Click to see this device in Device List"
              >
                {{ getDeviceName(deviceId) }}
              </div>
            </div>
          </div>
          
          <!-- Show other fields -->
          <div 
            v-for="(value, key) in getFilteredAdditionalFields(server)" 
            :key="key" 
            class="detail-row"
          >
            <strong>{{ formatFieldName(key) }}:</strong> {{ value }}
          </div>
          
          <div class="button-row">
            <button 
              class="action-btn edit-btn" 
              @click="openEditForm(server)" 
              :disabled="!canEditServer(server)">
              Edit
            </button>
            <button class="action-btn reserve-btn" @click="reserveServer(server)">Reserve</button>
            <button class="action-btn spec-btn" @click="showSystemSpecs(server)">System Specs</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Show message when no servers match filter -->
    <div v-if="serverFilter && filteredServers.length === 0" class="no-results">
      <p>No servers match your filter criteria.</p>
      <button @click="clearFilter" class="clear-filter-button">Clear Filter</button>
    </div>
    
    <!-- Floating add server button - only shown if user can add server -->
    <button
      class="floating-add-button" 
      @click="openNewServerForm">+
    </button>
    
    <!-- New Server Modal - fixed structure -->
    <div v-if="showNewServerModal" class="modal-overlay" @click.self="cancelNewServer">
      <div class="modal server-form-modal">
        <h3>Add New Server</h3>
        <div class="form-content">
          <div class="form-group">
            <label for="serverName">Server Name <span class="required-field">*</span></label>
            <input type="text" id="serverName" v-model="newServer.name" required>
          </div>
          
          <div class="form-group">
            <label for="cpuType">CPU Type <span class="required-field">*</span></label>
            <input type="text" id="cpuType" v-model="newServer.cpuType" required placeholder="e.g. SPR, HSW, EPYC">
          </div>
          
          <div class="form-group">
            <label for="ip">IP Address <span class="required-field">*</span></label>
            <input type="text" id="ip" v-model="newServer.ip" required>
          </div>
          
          <div class="form-group">
            <label for="owner">Owner <span class="required-field">*</span></label>
            <input 
              type="text" 
              id="owner" 
              v-model="newServer.owner" 
              :disabled="!isAdmin()" 
              required
            >
          </div>

          <div class="form-group">
            <label for="status">Status</label>
            <select id="status" v-model="newServer.status">
              <option value="on">On</option>
              <option value="retired">Retired</option>
              <option value="temporarily unavailable">Temporarily Unavailable</option>
            </select>
          </div>
          
          <!-- Add location field to the new server form -->
          <div class="form-group">
            <label for="location">Location <span class="required-field">*</span></label>
            <input type="text" id="location" v-model="newServer.location" placeholder="e.g. Room 101, Rack 3" required>
          </div>
          
          <div class="form-group">
            <label for="sudoUser">Sudo Username <span class="required-field">*</span></label>
            <input type="text" id="sudoUser" v-model="newServer.sudoUser" required>
          </div>
          
          <div class="form-group">
            <label for="sudoUserPassword">Sudo Password <span class="required-field">*</span></label>
            <input type="password" id="sudoUserPassword" v-model="newServer.sudoUserPassword" required>
          </div>
          
          <div class="form-group">
            <label for="bmcIp">BMC IP</label>
            <input type="text" id="bmcIp" v-model="newServer.bmcIp">
          </div>
          
          <div class="form-group">
            <label for="bmcUser">BMC Username</label>
            <input type="text" id="bmcUser" v-model="newServer.bmcUser">
          </div>
          
          <div class="form-group">
            <label for="bmcPassword">BMC Password</label>
            <input type="password" id="bmcPassword" v-model="newServer.bmcPassword">
          </div>
          
          <div class="form-group">
            <label for="ubuntuVersion">Ubuntu Version</label>
            <input type="text" id="ubuntuVersion" v-model="newServer.ubuntuVersion" placeholder="e.g. 22.04 LTS">
          </div>

          <div class="form-group">
            <label for="cpu">CPU</label>
            <input type="text" id="cpu" v-model="newServer.cpu" placeholder="e.g. Xeon Gold 6240">
          </div>

          <div class="form-group">
            <label for="cpuFreq">CPU Frequency</label>
            <input type="text" id="cpuFreq" v-model="newServer.cpuFreq" placeholder="e.g. 2.60 GHz">
          </div>
          
          <div class="form-group">
            <label for="motherboard">Motherboard</label>
            <input type="text" id="motherboard" v-model="newServer.motherboard" placeholder="e.g. Gigabyte AA112233">
          </div>
          
          <div class="form-group">
            <label for="numSockets">Number of Sockets</label>
            <input type="number" id="numSockets" v-model.number="newServer.numSockets">
          </div>
          
          <div class="form-group">
            <label for="coresPerSocket">CPU Cores per Socket</label>
            <input type="number" id="coresPerSocket" v-model.number="newServer.coresPerSocket">
          </div>

          <div class="form-group">
            <label for="memorySlots">Memory Slots</label>
            <input type="text" id="memorySlots" v-model="newServer.memorySlots" placeholder="e.g. 12 x 4 (12 slots per socket)">
          </div>

          <div class="form-group">
            <label for="dimmType">DIMM Type</label>
            <input type="text" id="dimmType" v-model="newServer.dimmType" placeholder="e.g. DDR4 3200 32GB">
          </div>

          <div class="form-group">
            <label for="numDimms">Number of DIMMs</label>
            <input type="text" id="numDimms" v-model="newServer.numDimms" placeholder="e.g. 4 32GB, 4 16GB, 4 16GB, 4 16GB">
          </div>
          
          <div class="form-group">
            <label for="note">Note</label>
            <textarea 
              id="note" 
              v-model="newServer.note" 
              placeholder="e.g. useful links to mother board/CPU datasheets."
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group device-selection-container">
            <label>Attached Devices</label>
            
            <div class="device-filter">
              <label for="deviceTypeFilter">Filter by Type:</label>
              <select id="deviceTypeFilter" v-model="deviceTypeFilter" class="device-type-filter">
                <option value="">All Types</option>
                <option value="NIC">NIC</option>
                <option value="SSD">SSD</option>
                <option value="FPGA">FPGA</option>
                <option value="GPU">GPU</option>
                <option value="CXL(FPGA)">CXL(FPGA)</option>
                <option value="CXL(ASIC)">CXL(ASIC)</option>
              </select>
            </div>
            
            <div v-if="hasHiddenSelectedDevices" class="filter-notice">
              <i>Note: Some selected devices are hidden by the current filter.</i>
              <button class="show-all-btn" @click="deviceTypeFilter = ''">Show All</button>
            </div>
            
            <div class="devices-selection">
              <div v-if="filteredDevices.length === 0" class="no-devices-message">
                No available devices{{ deviceTypeFilter ? ' of type ' + deviceTypeFilter : '' }}
              </div>
              <div 
                v-for="device in filteredDevices" 
                :key="device.id" 
                class="device-option"
                :class="{ 'selected': newServer.attachedDevices.includes(device.id) }"
                @click="handleDeviceOptionClick(newServer.attachedDevices, device.id)"
              >
                <div class="device-label">
                  <span class="device-name">{{ device.name }}</span>
                  <span class="device-type-badge">{{ device.type || 'Unknown' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="saveNewServer" class="save-btn">Save Server</button>
          <button @click="cancelNewServer" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
    
    <!-- Edit Server Modal - fixed structure -->
    <div v-if="showEditServerModal" class="modal-overlay" @click.self="cancelEditServer">
      <div class="modal server-form-modal">
        <h3>Edit Server: {{ editingServer.name }}</h3>
        <div class="form-content">
          <div class="form-group">
            <label for="editServerName">Server Name <span class="required-field">*</span></label>
            <input type="text" id="editServerName" v-model="editingServer.name" required>
          </div>
          
          <div class="form-group">
            <label for="editCpuType">CPU Type <span class="required-field">*</span></label>
            <input type="text" id="editCpuType" v-model="editingServer.cpuType" required>
          </div>
          
          <div class="form-group">
            <label for="editIp">IP Address <span class="required-field">*</span></label>
            <input type="text" id="editIp" v-model="editingServer.ip" required>
          </div>
          
          <div class="form-group">
            <label for="editOwner">Owner <span class="required-field">*</span></label>
            <input 
              type="text" 
              id="editOwner" 
              v-model="editingServer.owner" 
              :disabled="!isAdmin()" 
              required
            >
          </div>

          <div class="form-group">
            <label for="editStatus">Status</label>
            <select id="editStatus" v-model="editingServer.status">
              <option value="on">On</option>
              <option value="retired">Retired</option>
              <option value="temporarily unavailable">Temporarily Unavailable</option>
            </select>
          </div>
          
          <!-- Add location field to the edit server form -->
          <div class="form-group">
            <label for="editLocation">Location <span class="required-field">*</span></label>
            <input type="text" id="editLocation" v-model="editingServer.location" placeholder="e.g. Room 101, Rack 3" required>
          </div>
          
          <div class="form-group">
            <label for="editSudoUser">Sudo Username <span class="required-field">*</span></label>
            <input type="text" id="editSudoUser" v-model="editingServer.sudoUser" required>
          </div>
          
          <div class="form-group">
            <label for="editSudoUserPassword">Sudo Password <span class="required-field">*</span></label>
            <div class="password-input-container">
              <input 
                :type="editPasswordVisible ? 'text' : 'password'" 
                id="editSudoUserPassword" 
                v-model="editingServer.sudoUserPassword" 
                required
              >
              <button 
                type="button" 
                class="toggle-password-btn" 
                @click="editPasswordVisible = !editPasswordVisible"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="editBmcIp">BMC IP</label>
            <input type="text" id="editBmcIp" v-model="editingServer.bmcIp">
          </div>
          
          <div class="form-group">
            <label for="editBmcUser">BMC Username</label>
            <input type="text" id="editBmcUser" v-model="editingServer.bmcUser">
          </div>
          
          <div class="form-group">
            <label for="editBmcPassword">BMC Password</label>
            <div class="password-input-container">
              <input 
                :type="editBmcPasswordVisible ? 'text' : 'password'" 
                id="editBmcPassword" 
                v-model="editingServer.bmcPassword"
              >
              <button 
                type="button" 
                class="toggle-password-btn" 
                @click="editBmcPasswordVisible = !editBmcPasswordVisible"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="editUbuntuVersion">Ubuntu Version</label>
            <input type="text" id="editUbuntuVersion" v-model="editingServer.ubuntuVersion" placeholder="e.g. 22.04 LTS">
          </div>

          <div class="form-group">
            <label for="editCPU">CPU</label>
            <input type="text" id="editCPU" v-model="editingServer.cpu" placeholder="e.g. Xeon Gold 6240">
          </div>

          <div class="form-group">
            <label for="editCPUFreq">CPU Frequency</label>
            <input type="text" id="editCPUFreq" v-model="editingServer.cpuFreq" placeholder="e.g. 2.60 GHz">
          </div>
          
          <div class="form-group">
            <label for="editMotherboard">Motherboard</label>
            <input type="text" id="editMotherboard" v-model="editingServer.motherboard" placeholder="e.g. Gigabyte AA112233">
          </div>
          
          <div class="form-group">
            <label for="editNumSockets">Number of Sockets</label>
            <input type="number" id="editNumSockets" v-model.number="editingServer.numSockets">
          </div>
          
          <div class="form-group">
            <label for="editCoresPerSocket">CPU Cores per Socket</label>
            <input type="number" id="editCoresPerSocket" v-model.number="editingServer.coresPerSocket">
          </div>

          <div class="form-group">
            <label for="editMemorySlots">Memory Slots</label>
            <input type="text" id="editMemorySlots" v-model="editingServer.memorySlots" placeholder="e.g. 12 x 4 (12 slots per socket)">
          </div>

          <div class="form-group">
            <label for="editDimmType">DIMM Type</label>
            <input type="text" id="editDimmType" v-model="editingServer.dimmType" placeholder="e.g. DDR4 3200 32GB">
          </div> 

          <div class="form-group">
            <label for="editNumDimms">Number of DIMMs</label>
            <input type="text" id="editNumDimms" v-model="editingServer.numDimms" placeholder="e.g. 4 32GB, 4 16GB, 4 16GB, 4 16GB">
          </div>
                    
          <div class="form-group">
            <label for="editNote">Note</label>
            <textarea 
              id="editNote" 
              v-model="editingServer.note" 
              placeholder="e.g. useful links to mother board/CPU datasheets."
              rows="3"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="form-group device-selection-container">
            <label>Attached Devices</label>
            
            <div class="device-filter">
              <label for="editDeviceTypeFilter">Filter by Type:</label>
              <select id="editDeviceTypeFilter" v-model="deviceTypeFilter" class="device-type-filter">
                <option value="">All Types</option>
                <option value="NIC">NIC</option>
                <option value="SSD">SSD</option>
                <option value="FPGA">FPGA</option>
                <option value="GPU">GPU</option>
                <option value="CXL(FPGA)">CXL(FPGA)</option>
                <option value="CXL(ASIC)">CXL(ASIC)</option>
              </select>
            </div>
            
            <div v-if="hasHiddenSelectedDevices" class="filter-notice">
              <i>Note: Some attached devices are hidden by the current filter.</i>
              <button class="show-all-btn" @click="deviceTypeFilter = ''">Show All</button>
            </div>
            
            <div class="devices-selection">
              <div v-if="filteredDevices.length === 0" class="no-devices-message">
                No available devices{{ deviceTypeFilter ? ' of type ' + deviceTypeFilter : '' }}
              </div>
              <div 
                v-for="device in filteredDevices" 
                :key="device.id" 
                class="device-option"
                :class="{ 
                  'selected': editingServer.attachedDevices && editingServer.attachedDevices.includes(device.id),
                  'already-attached': isDeviceAttachedToAnotherServer(device.id)
                }"
                @click="isDeviceAttachedToAnotherServer(device.id) ? null : handleDeviceOptionClick(editingServer.attachedDevices, device.id)"
              >
                <div class="device-label">
                  <span class="device-name">{{ device.name }}</span>
                  <div class="device-label-content">
                    <span class="device-type-badge">{{ device.type || 'Unknown' }}</span>
                    <span v-if="isDeviceAttachedToAnotherServer(device.id)" class="attached-elsewhere-note">
                      (Attached to another server)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="saveEditServer" class="save-btn">Save Changes</button>
          <button @click="cancelEditServer" class="cancel-btn">Cancel</button>
          <button 
            v-if="canDeleteServer(editingServer)" 
            @click="confirmDeleteServer" 
            class="delete-btn"
          >Delete Server</button>
        </div>
      </div>
    </div>
    
    <!-- System Specs Modal - fixed structure -->
    <div v-if="showSpecsModal" class="modal-overlay" @click.self="closeSystemSpecs">
      <div class="modal specs-modal">
        <h3>System Specifications: {{ activeSpecServer?.name }}</h3>
        
        <div class="specs-content form-content">
          <div class="spec-row">
            <strong>CPU:</strong> {{ activeSpecServer?.cpu || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong>CPU Frequency:</strong> {{ activeSpecServer?.cpuFreq || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong>Motherboard:</strong> {{ activeSpecServer?.motherboard || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong>Number of Sockets:</strong> {{ activeSpecServer?.numSockets || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong>CPU Cores per Socket:</strong> {{ activeSpecServer?.coresPerSocket || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong>Memory Slots:</strong> {{ activeSpecServer?.memorySlots || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong>DIMM Type:</strong> {{ activeSpecServer?.dimmType || 'N/A' }}
          </div>
          
          <div class="spec-row">
            <strong># of DIMMs:</strong> {{ activeSpecServer?.numDimms || 'N/A' }}
          </div>
          
        </div>
        
        <div class="modal-actions">
          <button @click="closeSystemSpecs" class="close-btn">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { firestore } from '@/firebase'
import { auth, getUserRole, isAdmin, isUser } from '@/firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore'
import { dailyCache } from '@/utils/dailyCache'
import { getDeviceTypesList } from '@/utils/deviceFieldConfig'
import '@/assets/styles/common/common-ui.css'
import '@/assets/styles/common/modal-styles.css'
import '@/assets/styles/components/ServerList.css'

// Define shared field lists as constants outside the component
const BASIC_SERVER_FIELDS = ['id', 'name', 'cpuType', 'ip'];
const SYSTEM_SPEC_FIELDS = ['cpu', 'cpuFreq', 'memorySlots', 'dimmType', 'numDimms', 'motherboard', 'numSockets', 'coresPerSocket'];
const ACCESS_FIELDS = ['owner', 'sudoUser', 'sudoUserPassword', 'bmcIp', 'bmcUser', 'bmcPassword'];
const METADATA_FIELDS = ['location', 'attachedDevices', 'status', 'ubuntuVersion', 'note'];

export default {
  name: 'ServerList',
  data() {
    return {
      servers: [],
      devices: [],
      expandedServers: new Set(),
      visiblePasswords: new Set(), // Combined set to track all password types
      showSpecsModal: false,
      activeSpecServer: null,
      showNewServerModal: false,
      newServer: this.createDefaultServerObject(),
      showEditServerModal: false,
      editingServer: null,
      deviceTypeFilter: '',
      serverFilter: this.$route.query.filter || '',
      editPasswordVisible: false,
      editBmcPasswordVisible: false,
      userRole: 'guest',
      ownershipFilter: 'all', // Add ownership filter property
      
      // Add field definitions to component data for access in template and methods
      basicServerFields: BASIC_SERVER_FIELDS,
      systemSpecFields: SYSTEM_SPEC_FIELDS,
      accessFields: ACCESS_FIELDS,
      metadataFields: METADATA_FIELDS,
      expandedNotes: new Set(), // Track expanded notes
      favoriteServers: new Set(), // Add Set to track favorite server IDs
      userDocId: null, // Store the user document ID for updates
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
    
    // Combined function for eligible devices based on context
    eligibleDevices() {
      // For new server
      if (!this.editingServer) {
        // Return devices not attached to any server
        return this.devices.filter(device => !device.attachedServer);
      }
      
      // For editing existing server
      return this.devices.filter(device => {
        // Include if device is not attached to any server or attached to this server
        return !device.attachedServer || device.attachedServer === this.editingServer.id;
      });
    },
    
    // Filtered devices based on selected type
    filteredDevices() {
      const filtered = this.eligibleDevices.filter(device =>
        !this.deviceTypeFilter || device.type === this.deviceTypeFilter
      );

      // Sort by: 1) device type, 2) status, 3) name alphabetically (same as DeviceList)
      const deviceTypes = getDeviceTypesList();

      return filtered.sort((a, b) => {
        // 1. Get device type indices from the deviceTypes array (case-insensitive)
        const typeA = a.type ? a.type.toUpperCase() : '';
        const typeB = b.type ? b.type.toUpperCase() : '';

        const indexA = deviceTypes.findIndex(t => t.toUpperCase() === typeA);
        const indexB = deviceTypes.findIndex(t => t.toUpperCase() === typeB);

        // Use default high index for types not in the deviceTypes array
        const priorityA = indexA !== -1 ? indexA : deviceTypes.length;
        const priorityB = indexB !== -1 ? indexB : deviceTypes.length;

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
    
    // Check if there are hidden selected devices
    hasHiddenSelectedDevices() {
      if (!this.deviceTypeFilter) return false;
      
      const targetArray = this.editingServer 
        ? this.editingServer.attachedDevices 
        : this.newServer.attachedDevices;
      
      return targetArray.some(deviceId => {
        const device = this.devices.find(d => d.id === deviceId);
        return device && device.type !== this.deviceTypeFilter;
      });
    },
    
    // Filter servers based on search criteria
    filteredServers() {
      let result = this.servers;
      
      // Apply ownership filter
      if (this.ownershipFilter === 'owned' && this.currentUsername) {
        result = result.filter(server => 
          server.owner && server.owner.toLowerCase() === this.currentUsername.toLowerCase()
        );
      } else if (this.ownershipFilter === 'favorite') {
        // Filter by favorite status if that option is selected
        result = result.filter(server => this.isServerFavorite(server.id));
      }
      
      // Apply filter if specified
      if (this.serverFilter) {
        const filter = this.serverFilter.toLowerCase().trim();

        result = result.filter(server =>
          (server.name && server.name.toLowerCase().includes(filter)) ||
          (server.cpuType && server.cpuType.toLowerCase().includes(filter)) ||
          (server.location && server.location.toLowerCase().includes(filter)) ||
          this.serverHasMatchingDevice(server, filter)
        );
      }
      
      // Sort by CPU type group first, then by name alphabetically
      return result.sort((a, b) => {
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
    },
    
    // Combined list of all fields to exclude when showing additional fields
    allExcludedFields() {
      return [
        ...this.basicServerFields,
        ...this.systemSpecFields,
        ...this.accessFields,
        ...this.metadataFields
      ];
    }
  },
  watch: {
    // Add this watcher to handle route changes
    '$route.query.filter'(newFilter) {
      if (newFilter !== undefined) {
        this.serverFilter = newFilter;
      }
    },
    // Add watcher for ownership filter in query
    '$route.query.ownershipFilter'(newFilter) {
      if (newFilter) {
        this.ownershipFilter = newFilter;
      }
    }
  },
  methods: {
    updateCache() {
      const cacheData = {
        devices: this.devices,
        servers: this.servers,
        timestamp: Date.now()
      };
      localStorage.setItem('firebaseCache', JSON.stringify(cacheData));
    },
    // Role-based permission helpers
    isAdmin() {
      return isAdmin();
    },
    
    isUser() {
      return isUser();
    },
    
    // Permission methods
    canAddServer() {
      return isAdmin() || isUser();
    },
    
    canEditServer(server) {
      if (!server || !this.currentUserEmail) return false;
      if (isAdmin()) return true;
      if (isUser()) {
        return server.owner && server.owner.toLowerCase() === this.currentUsername.toLowerCase();
      }
      return false;
    },
    
    canDeleteServer(server) {
      return this.canEditServer(server);
    },
    
    // Create default server object with current user as owner
    createDefaultServerObject() {
      const defaultObj = {
        name: '',
        cpuType: '',
        ip: '',
        owner: this.currentUsername || '',
        sudoUser: '',
        sudoUserPassword: '',
        bmcIp: '',
        bmcUser: '',
        bmcPassword: '',
        status: 'on',
        location: '',
        ubuntuVersion: '',
        motherboard: '',
        numSockets: null,
        coresPerSocket: null,
        note: '',
        attachedDevices: [],
        memorySlots: '',
        numDimms: ''
      };
      
      SYSTEM_SPEC_FIELDS.forEach(field => {
        if (!['cpu', 'cpuFreq', 'dimmType', 'motherboard', 'memorySlots', 'numDimms'].includes(field)) {
          defaultObj[field] = null;
        } else {
          defaultObj[field] = '';
        }
      });
      
      return defaultObj;
    },
    
    // Get CSS class for server based on CPU type
    getCpuColorClass(cpuType) {
      if (!cpuType) return 'cpu-default';
      
      const cpuLower = cpuType.toLowerCase();
      
      // Class mapping by CPU type
      if (cpuLower.includes('skx') || cpuLower.includes('icx') || cpuLower.includes('skl')) return 'cpu-blue';
      if (cpuLower.includes('spr') || cpuLower.includes('emr') || cpuLower.includes('gnr')) return 'cpu-green';
      if (cpuLower.includes('hsw') || cpuLower.includes('bdw') || cpuLower.includes('haswell') || cpuLower.includes('broadwell')) return 'cpu-orange';
      if (cpuLower.includes('epyc')) return 'cpu-purple';
      
      return 'cpu-default';
    },
    
    // Toggle expanded state of a server
    toggleExpand(serverId) {
      if (this.expandedServers.has(serverId)) {
        this.expandedServers.delete(serverId);
      } else {
        this.expandedServers.add(serverId);
      }
    },
    
    // Check if server is expanded
    isExpanded(serverId) {
      return this.expandedServers.has(serverId);
    },
    
    // Fixed to correctly handle server object properties
    getFilteredAdditionalFields(server) {
      if (!server) return {};
      
      const { ...allFields } = server;
      
      // Filter out excluded fields, empty values, and fields containing "Transfer"
      return Object.fromEntries(
        Object.entries(allFields).filter(([key, value]) => 
          !this.allExcludedFields.includes(key) && 
          !key.toLowerCase().includes('transfer') &&
          value !== null && 
          value !== undefined && 
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        )
      );
    },
    
    // Format field names for display
    formatFieldName(key) {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
    },
    
    // Format IP address for display (updated to handle empty IPs)
    formatIp(ip) {
      if (!ip) return '';
      return Array.isArray(ip) ? ip.join(', ') : ip;
    },
    
    // Get status color class
    getStatusColor(status) {
      if (!status) return 'status-red';
      return status.toLowerCase() === 'on' ? 'status-green' : 'status-red';
    },
    
    // Format status for display
    formatStatus(status) {
      if (!status) return 'Unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
    
    // Combined function for password visibility
    isPasswordVisible(serverId, type = 'sudo') {
      // Only allow password visibility if user has permissions
      if (!this.hasViewPermissions()) {
        return false;
      }
      return this.visiblePasswords.has(`${type}-${serverId}`);
    },
    
    // Toggle password visibility with auto-hide
    togglePassword(serverId, type = 'sudo') {
      // Only allow toggling if user has permissions
      if (!this.hasViewPermissions()) {
        return;
      }
      
      const key = `${type}-${serverId}`;
      
      if (this.visiblePasswords.has(key)) {
        this.visiblePasswords.delete(key);
      } else {
        this.visiblePasswords.add(key);
        // Auto-hide password after 5 seconds
        setTimeout(() => {
          this.visiblePasswords.delete(key);
          this.$forceUpdate();
        }, 5000);
      }
    },
    
    // Alias for backward compatibility
    isSudoPasswordVisible(serverId) {
      return this.isPasswordVisible(serverId, 'sudo');
    },
    
    toggleSudoPassword(serverId) {
      this.togglePassword(serverId, 'sudo');
    },
    
    // Add these methods for BMC password visibility
    isBmcPasswordVisible(serverId) {
      return this.isPasswordVisible(serverId, 'bmc');
    },
    
    toggleBmcPassword(serverId) {
      this.togglePassword(serverId, 'bmc');
    },
    
    // Show/hide system specs modal
    showSystemSpecs(server) {
      this.activeSpecServer = server;
      this.showSpecsModal = true;
    },
    
    closeSystemSpecs() {
      this.showSpecsModal = false;
      this.activeSpecServer = null;
    },
    
    // Get device name by ID
    getDeviceName(deviceId) {
      const device = this.devices.find(d => d.id === deviceId);
      return device ? device.name : 'Unknown Device';
    },
    
    // Get color class based on device type
    getDeviceTypeColorClass(deviceId) {
      const device = this.devices.find(d => d.id === deviceId);
      if (!device || !device.type) return 'device-type-default';
      
      const typeStr = device.type.toLowerCase();
      
      // Match device types to color classes
      if (typeStr.includes('nic')) return 'device-type-blue';
      if (typeStr.includes('ssd')) return 'device-type-green';
      if (typeStr.includes('fpga')) return 'device-type-orange';
      if (typeStr.includes('gpu')) return 'device-type-red';
      if (typeStr.includes('cxl')) return 'device-type-purple';
      
      return 'device-type-default';
    },
    
    // Navigate to device list and filter by device name
    navigateToDevice(deviceId) {
      const device = this.devices.find(d => d.id === deviceId);
      if (device && device.name) {
        this.$router.push({
          path: '/devices',
          query: { filter: device.name }
        });
      }
    },
    
    // Toggle device selection in device array
    toggleDevice(deviceArray, deviceId) {
      if (!deviceArray) deviceArray = [];
      
      const index = deviceArray.indexOf(deviceId);
      if (index === -1) {
        deviceArray.push(deviceId);
      } else {
        deviceArray.splice(index, 1);
      }
      
      this.$forceUpdate();
    },
    
    // Form management
    openNewServerForm() {
      if (!this.canAddServer()) {
        alert('You do not have permission to add servers.');
        return;
      }
      this.newServer = this.createDefaultServerObject();
      this.showNewServerModal = true;
    },
    
    // Form validation
    validateServerForm(server) {
      const requiredFields = [
        { field: 'name', message: 'Server name is required' },
        { field: 'cpuType', message: 'CPU Type is required' },
        { field: 'ip', message: 'IP Address is required' },
        { field: 'owner', message: 'Owner is required' },
        { field: 'location', message: 'Location is required' },
        { field: 'sudoUser', message: 'Sudo Username is required' },
        { field: 'sudoUserPassword', message: 'Sudo Password is required' }
      ];
      
      for (const { field, message } of requiredFields) {
        if (!server[field]) {
          alert(message);
          return false;
        }
      }
      return true;
    },
    
    // Save server
    async saveServer(isNew = true) {
      const serverData = isNew ? this.newServer : this.editingServer;
      
      if (!isAdmin() && serverData.owner.toLowerCase() !== this.currentUsername.toLowerCase()) {
        alert('As a regular user, you can only create or edit servers that you own.');
        return;
      }
      
      if (!this.validateServerForm(serverData)) return;
      
      try {
        let previousAttachedDevices = [];
        let serverId;
        
        if (!isNew) {
          serverId = serverData.id;
          const existingServer = this.servers.find(s => s.id === serverId);
          previousAttachedDevices = existingServer ? [...(existingServer.attachedDevices || [])] : [];
        }
        
        const currentAttachedDevices = serverData.attachedDevices || [];
        const devicesToAdd = currentAttachedDevices.filter(id => !previousAttachedDevices.includes(id));
        const devicesToRemove = previousAttachedDevices.filter(id => !currentAttachedDevices.includes(id));
        
        if (isNew) {
          const serversCollection = collection(firestore, 'servers');
          const docRef = await addDoc(serversCollection, serverData);
          serverId = docRef.id;
          this.showNewServerModal = false;
        } else {
          const { id, ...serverDataWithoutId } = {...serverData};
          if (!id) throw new Error('Server ID is missing for update operation');
          
          if (!serverDataWithoutId.attachedDevices) {
            serverDataWithoutId.attachedDevices = [];
          }
          
          const serverRef = doc(firestore, 'servers', id);
          await updateDoc(serverRef, serverDataWithoutId);
          
          this.showEditServerModal = false;
          this.editingServer = null;
        }
        
        for (const deviceId of devicesToAdd) {
          await this.updateDeviceAttachment(deviceId, serverId, true);
        }
        
        for (const deviceId of devicesToRemove) {
          await this.updateDeviceAttachment(deviceId, serverId, false);
        }
        
        // Refresh cache to show changes immediately
        await this.refreshServerCache();
        
      } catch (error) {
        console.error(`Error ${isNew ? 'adding' : 'updating'} server:`, error);
        alert(`Failed to ${isNew ? 'add' : 'update'} server: ${error.message}`);
      }
    },
    
    // Update device attachment status
    async updateDeviceAttachment(deviceId, serverId, attach) {
      try {
        const deviceRef = doc(firestore, 'devices', deviceId);
        const deviceSnapshot = await getDoc(deviceRef);
        
        if (deviceSnapshot.exists()) {
          const updateData = {
            status: attach ? 'used' : 'idle',
            attachedServer: attach ? serverId : ''
          };
          await updateDoc(deviceRef, updateData);
        }
      } catch (error) {
        console.error(`Error updating device ${deviceId}:`, error);
      }
    },
    
    // Delete server with device detachment
    async confirmDeleteServer() {
      if (!this.editingServer) return;
      
      if (confirm(`Are you sure you want to delete server "${this.editingServer.name}"?`)) {
        try {
          const serverId = this.editingServer.id;
          
          if (this.editingServer.attachedDevices && this.editingServer.attachedDevices.length > 0) {
            for (const deviceId of this.editingServer.attachedDevices) {
              await this.updateDeviceAttachment(deviceId, serverId, false);
            }
          }
          
          const serverRef = doc(firestore, 'servers', serverId);
          await deleteDoc(serverRef);
          
          // Refresh cache to show changes immediately
          await this.refreshServerCache();
          
          this.showEditServerModal = false;
          this.editingServer = null;
        } catch (error) {
          console.error('Error deleting server:', error);
          alert('Failed to delete server: ' + error.message);
        }
      }
    },
    
    // Cancel forms
    cancelNewServer() {
      this.showNewServerModal = false;
    },
    
    cancelEditServer() {
      this.showEditServerModal = false;
      this.editingServer = null;
    },
    
    // Open edit form
    openEditForm(server) {
      if (!this.canEditServer(server)) {
        if (isUser()) {
          alert('You can only edit servers that you own.');
        } else {
          alert('You do not have permission to edit servers.');
        }
        return;
      }
      
      this.editPasswordVisible = false;
      this.editingServer = JSON.parse(JSON.stringify(server));
      this.showEditServerModal = true;
    },
    
    // Save edit server
    saveEditServer() {
      if (!this.editingServer || !this.editingServer.id) {
        alert('Error: Cannot save changes - no server selected or missing ID');
        return;
      }
      this.saveServer(false);
    },
    
    // Navigation to reservation page
    reserveServer(server) {
      this.$router.push({
        path: '/calendar',
        query: { server: server.name }
      });
    },
    
    // Device attachment helpers
    isDeviceAttachedToAnotherServer(deviceId) {
      if (!this.editingServer) return false;
      
      const device = this.devices.find(d => d.id === deviceId);
      return device && device.attachedServer && device.attachedServer !== this.editingServer.id;
    },
    
    // Check if server has device matching filter
    serverHasMatchingDevice(server, filter) {
      if (!server.attachedDevices || !server.attachedDevices.length) {
        return false;
      }

      return server.attachedDevices.some(deviceId => {
        const device = this.devices.find(d => d.id === deviceId);
        if (!device) return false;

        // Check device name or serial number
        const nameMatch = device.name && device.name.toLowerCase().includes(filter);
        const serialMatch = device.serialNumber && device.serialNumber.toLowerCase().includes(filter);

        return nameMatch || serialMatch;
      });
    },
    
    // Clear filter
    clearFilter() {
      this.serverFilter = '';
    },
    
    // Added new method to handle device option clicks
    handleDeviceOptionClick(deviceArray, deviceId) {
      // Skip if device is disabled (attached to another server)
      if (this.editingServer && this.isDeviceAttachedToAnotherServer(deviceId)) {
        return;
      }
      
      this.toggleDevice(deviceArray, deviceId);
    },
    
    // Add these click-outside handlers to close modals
    closeModalOnOutsideClick(e) {
      // Close the modal if clicking outside the modal content
      if (e.target.classList.contains('modal-overlay')) {
        this.cancelNewServer();
        this.cancelEditServer();
        this.closeSystemSpecs();
      }
    },
    saveNewServer() {
      this.saveServer(true);
    },
    
    hasViewPermissions() {
      return isAdmin() || isUser();
    },
    // Toggle note expansion
    toggleNoteExpansion(serverId) {
      if (this.expandedNotes.has(serverId)) {
        this.expandedNotes.delete(serverId);
      } else {
        this.expandedNotes.add(serverId);
      }
    },

    // Handle note click - prevent expansion when clicking on links
    handleNoteClick(event, serverId) {
      // If clicked element is a link, don't toggle expansion
      if (event.target.tagName === 'A') {
        return;
      }
      this.toggleNoteExpansion(serverId);
    },
    
    // Check if note is long enough to be truncated
    isNoteTruncated(note) {
      return note && note.length > 100;
    },

    // Convert URLs in text to clickable links
    linkifyText(text) {
      if (!text) return '';

      // Regular expression to match URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;

      // Replace URLs with anchor tags
      return text.replace(urlRegex, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="auto-link">${url}</a>`;
      });
    },

    // Parse BMC IPs (handles comma-separated IPs)
    parseBmcIps(bmcIp) {
      if (!bmcIp) return [];
      // Split by comma and trim whitespace
      return bmcIp.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    },
    // CPU type group priority for sorting
    getCpuTypeGroupIndex(cpuType) {
      if (!cpuType) return 999;
      
      const cpuLower = cpuType.toLowerCase();
      
      if (cpuLower.includes('spr') || cpuLower.includes('emr') || cpuLower.includes('gnr')) return 0;
      if (cpuLower.includes('skx') || cpuLower.includes('icx') || cpuLower.includes('skl')) return 1;
      if (cpuLower.includes('epyc')) return 2;
      if (cpuLower.includes('hsw') || cpuLower.includes('bdw') || 
          cpuLower.includes('haswell') || cpuLower.includes('broadwell')) return 3;
      
      return 4;
    },
    resetState() {
      this.serverFilter = this.$route.query.filter || '';
      if (this.$route.query.ownershipFilter) {
        this.ownershipFilter = this.$route.query.ownershipFilter;
      }
    },
    // Favorite server management
    isServerFavorite(serverId) {
      return this.favoriteServers.has(serverId);
    },
    
    async toggleFavorite(serverId) {
      if (!this.currentUserEmail) return;
      
      if (this.favoriteServers.has(serverId)) {
        this.favoriteServers.delete(serverId);
      } else {
        this.favoriteServers.add(serverId);
      }
      
      await this.saveFavorites();
    },
    
    // Save/load favorites
    async saveFavorites() {
      if (!this.currentUserEmail || !this.userDocId) return;
      
      try {
        const userRef = doc(firestore, 'authorizedUsers', this.userDocId);
        await updateDoc(userRef, {
          favorite_servers: Array.from(this.favoriteServers)
        });
      } catch (error) {
        console.error('Error updating favorites:', error);
      }
    },
    
    async loadFavorites() {
      if (!this.currentUserEmail) return;
      
      try {
        const usersRef = collection(firestore, 'authorizedUsers');
        const q = query(usersRef, where("email", "==", this.currentUserEmail));
        
        onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            this.userDocId = userDoc.id;
            
            const userData = userDoc.data();
            if (userData && userData.favorite_servers) {
              this.favoriteServers = new Set(userData.favorite_servers);
            } else {
              this.favoriteServers = new Set();
            }
          }
        });
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    },

    // Load servers using daily cache
    async loadServers() {
      try {
        const servers = await dailyCache.loadData('servers');
        this.servers = servers.map(doc => ({
          ...doc,
          attachedDevices: doc.attachedDevices || []
        }));
        console.log('Loaded servers:', this.servers.length);
      } catch (error) {
        console.error('Error loading servers:', error);
        this.servers = [];
      }
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

    // Refresh server cache after changes
    async refreshServerCache() {
      try {
        this.servers = await dailyCache.refreshData('servers');
        this.devices = await dailyCache.refreshData('devices');
        console.log('Cache refreshed - Servers:', this.servers.length, 'Devices:', this.devices.length);
      } catch (error) {
        console.error('Error refreshing cache:', error);
      }
    },
  },
  async created() {
    // Load data using daily cache
    this.loadServers();
    this.loadDevices();
    
    if (auth.currentUser) {
      this.userRole = await getUserRole();
    }
    
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userRole = await getUserRole();
        this.loadFavorites();
      } else {
        this.userRole = 'guest';
        this.favoriteServers = new Set();
      }
    });

    if (this.$route.query.ownershipFilter) {
      this.ownershipFilter = this.$route.query.ownershipFilter;
    }
  },
  mounted() {
    document.addEventListener('click', this.closeModalOnOutsideClick);
    if (this.currentUserEmail) {
      this.loadFavorites();
    }
  },
  
  beforeUnmount() {
    document.removeEventListener('click', this.closeModalOnOutsideClick);
  }
}
</script>

