<template>
  <div class="reservation-calendar-container">
    <!-- Home icon button using common styles -->
    <router-link to="/home" class="home-icon-button" title="Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </router-link>
    <div class="reservation-calendar">
      <!-- Server View -->
      <div class="server-view">
        <!-- Week navigation (we can still do +/- 7 days, though we now start from "today" not Monday) -->
        <div class="week-nav">
          <button @click="moveWeek(-1)">&lt;</button>
          <span class="week-range">{{ formatWeekRange(weekStart) }}</span>
          <button @click="moveWeek(1)">&gt;</button>
        </div>
        
        <!-- Consolidated filter container with unified search -->
        <div class="filter-container">
          <div class="filter">
            <label for="unifiedFilter">Filter:</label>
            <input 
              id="unifiedFilter"
              v-model="unifiedFilter" 
              placeholder="Server name, CPU type, or device name" 
              class="filter-input"
            />
            <!-- Add favorite toggle button -->
            <button 
              v-if="currentUserEmail"
              @click="showOnlyFavorites = !showOnlyFavorites" 
              class="favorite-filter-btn"
              :class="{ 'active': showOnlyFavorites }"
              :title="showOnlyFavorites ? 'Show all servers' : 'Show only favorites'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                <path :fill="showOnlyFavorites ? 'currentColor' : 'none'" 
                      :stroke="showOnlyFavorites ? 'none' : 'currentColor'"
                      stroke-width="1.5"
                      d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </button>
            <button 
              v-if="unifiedFilter || showOnlyFavorites" 
              class="clear-filter-btn" 
              @click="clearAllFilters()" 
              title="Clear filter"
            >
              ×
            </button>
          </div>
          <div class="filter-stats" v-if="unifiedFilter || showOnlyFavorites">
            <div>Showing {{ filteredServers.length }} of {{ serversList.length }} servers</div>
          </div>
        </div>

        <!-- Days container -->
        <div class="days-container">
          <div
            v-for="dayObj in serverWeekDays"
            :key="dayObj.date"
            class="day-section"
            :class="{ today: isSameDay(dayObj.date, new Date()) }"
          >
            <!-- Day header with date and time axis -->
            <div class="day-header">
              <div class="day-title">{{ formatDayHeader(dayObj.date) }}</div>
              <div class="day-time-axis">
                <div v-for="hour in axisTimes" :key="hour" class="axis-time">
                  {{ formatAxisHour(hour) }}
                </div>
              </div>
            </div>

            <div class="content-wrapper">
              <div class="server-labels">
                <div
                  v-for="srv in filteredServers"
                  :key="srv.id"
                  class="server-label"
                  @click="showServerDetails(srv)"
                >
                  <div class="server-label-content">
                    <span class="status-dot" :class="getStatusColor(srv.status)"></span>
                    {{ srv.name }}
                  </div>
                </div>
              </div>
              <div class="timeline-container">
                <div
                  v-if="isSameDay(dayObj.date, new Date())"
                  class="current-time-arrow"
                  :style="currentTimeArrowStyle(dayObj.date)"
                ></div>
                <div
                  class="timeline"
                  :style="{ height: filteredServers.length * rowHeight + 'px' }"
                  @mousedown="handleTimelineContainerMousedown(dayObj.date, $event)"
                  :data-day-index="index"
                >
                  <!-- For each server row -->
                  <div
                    v-for="(srv, serverIndex) in filteredServers"
                    :key="srv.id"
                    class="reservation-row"
                    :style="{ top: (serverIndex * rowHeight) + 'px', height: rowHeight + 'px' }"
                    :data-server-id="srv.id"
                    :data-server-index="serverIndex"
                  >
                    <div
                      class="reservation-container"
                      @mousedown.stop="handleReservationContainerMousedown(srv, dayObj.date, $event)"
                      @dragover.prevent="handleDragOver($event, srv, dayObj.date)"
                      @drop="onDrop($event, srv, dayObj.date)"
                      :data-day-date="dayObj.date.toISOString()"
                      :data-server-name="srv.name"
                    >
                      <!-- existing reservations -->
                      <div
                        v-for="res in getReservationsForServerAndDay(srv, dayObj.date)"
                        :key="res.id"
                        class="reservation"
                        :class="[getUrgencyColorClass(res.urgency), {'my-reservation': isMyReservation(res)}]"
                        :draggable="false"
                        @mousedown="startCustomDrag(res, srv, dayObj.date, $event)"
                        :style="getReservationStyle(res, dayObj.date)"
                      >
                        <span class="reservation-title">{{ res.username }}</span>
                      </div>

                      <!-- preview only if same day + server -->
                      <div
                        v-if="
                          dragCreation.active &&
                          isSameDay(dragCreation.day, dayObj.date) &&
                          dragCreation.server === srv
                        "
                        class="drag-preview"
                        :style="getDragPreviewStyle()"
                      ></div>

                      <!-- Drag preview for dragged reservations -->
                      <div
                        v-if="draggedReservation && isDraggingOver(srv, dayObj.date)"
                        class="drag-grid-preview"
                        :style="getDragGridPreviewStyle()"
                      ></div>
                    </div>
                  </div>
                  <!-- current time line overlay -->
                  <div
                    v-if="isSameDay(dayObj.date, new Date())"
                    class="current-time-line-timeline"
                    :style="currentTimeLineStyle(dayObj.date)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="customDragActive" class="custom-drag-preview" :style="customDragPreviewStyle"></div>
  </div>
  
  <!-- Using common styles for the floating add button  -->
  <button class="floating-add-button" @click="openReservationForm">+</button>
  
  <div v-if="showReservationForm" class="app-modal-overlay">
    <div class="app-modal">
      <div class="app-modal-header">
        <h3>Create New Reservation</h3>
      </div>
      <div class="app-modal-content">
        <div class="app-form-group">
          <label for="server">Server <span class="app-required-field">*</span></label>
          <select v-model="newReservation.server" id="server" required>
            <option value="" disabled>Select a server</option>
            <option v-for="srv in sortedServersList" :key="srv.id" :value="srv.name">{{ srv.name }}</option>
          </select>
        </div>
        
        <div class="app-form-group">
          <label for="urgency">Urgency <span class="app-required-field">*</span></label>
          <select v-model="newReservation.urgency" id="urgency" required>
            <option value="" disabled>Select urgency level</option>
            <option value="co-run">Co-run</option>
            <option value="exclusive">Exclusive</option>
            <option value="exclusive (urgent)">Exclusive (Urgent)</option>
            <option value="exclusive (may yield)">Exclusive (May Yield)</option>
          </select>
        </div>
        
        <div class="app-form-group">
          <label for="username">Username</label>
          <input v-model="currentUsername" id="username" type="text" disabled />
        </div>
        
        <div class="app-form-group">
          <div class="date-time-row">
            <div class="date-time-group">
              <label for="startDate">Start Date <span class="app-required-field">*</span></label>
              <select v-model="startDateInput" id="startDate" @change="validateTimes">
                <option v-for="choice in startDateChoices" :key="choice.label" :value="choice.label">{{ choice.label }}</option>
              </select>
            </div>
            <div class="date-time-group">
              <label for="startTime">Start Time <span class="app-required-field">*</span></label>
              <select v-model="startTimeInput" id="startTime" @change="validateTimes">
                <option v-for="choice in startTimeChoices" :key="choice" :value="choice">{{ choice }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="app-form-group">
          <div class="date-time-row">
            <div class="date-time-group">
              <label for="endDate">End Date <span class="app-required-field">*</span></label>
              <select v-model="endDateInput" id="endDate" @change="validateTimes">
                <option v-for="choice in endDateChoices" :key="choice.label" :value="choice.label">{{ choice.label }}</option>
              </select>
            </div>
            <div class="date-time-group">
              <label for="endTime">End Time <span class="app-required-field">*</span></label>
              <select v-model="endTimeInput" id="endTime" @change="validateTimes">
                <option v-for="choice in endTimeChoices" :key="choice" :value="choice">{{ choice }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="app-form-group">
          <label for="note">Note</label>
          <textarea v-model="newReservation.note" id="note" placeholder="Add any additional information"></textarea>
        </div>
      </div>
      
      <div class="app-modal-footer">
        <button @click="confirmReservation" class="app-btn app-btn-primary">Create</button>
        <button @click="cancelReservation" class="app-btn app-btn-secondary">Cancel</button>
      </div>
    </div>
  </div>

  <div v-if="showEditModal" class="app-modal-overlay">
    <div class="app-modal">
      <div class="app-modal-header">
        <h3>Edit Reservation</h3>
      </div>
      <div class="app-modal-content">
        <div class="app-form-group">
          <label for="server">Server <span class="app-required-field">*</span></label>
          <select v-model="editingReservation.server" id="server">
            <option v-for="srv in sortedServersList" :key="srv.id" :value="srv.name">{{ srv.name }}</option>
          </select>
        </div>
        
        <div class="app-form-group">
          <label for="urgency">Urgency <span class="app-required-field">*</span></label>
          <select v-model="editingReservation.urgency" id="urgency">
            <option value="co-run">Co-run</option>
            <option value="exclusive">Exclusive</option>
            <option value="exclusive (urgent)">Exclusive (Urgent)</option>
            <option value="exclusive (may yield)">Exclusive (May Yield)</option>
          </select>
        </div>
        
        <div class="app-form-group">
          <label for="username">Username</label>
          <input v-model="editingReservation.username" id="username" type="text" disabled />
        </div>
        
        <div class="app-form-group">
          <div class="date-time-row">
            <div class="date-time-group">
              <label for="editStartDate">Start Date <span class="app-required-field">*</span></label>
              <select v-model="editingReservation.startDate" id="editStartDate" @change="validateEditTimes">
                <option v-for="choice in editStartDateChoices" :key="choice.label" :value="choice.label">{{ choice.label }}</option>
              </select>
            </div>
            <div class="date-time-group">
              <label for="editStartTime">Start Time <span class="app-required-field">*</span></label>
              <select v-model="editingReservation.startTime" id="editStartTime" @change="validateEditTimes">
                <option v-for="choice in editStartTimeChoices" :key="choice" :value="choice">{{ choice }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="app-form-group">
          <div class="date-time-row">
            <div class="date-time-group">
              <label for="editEndDate">End Date <span class="app-required-field">*</span></label>
              <select v-model="editingReservation.endDate" id="editEndDate" @change="validateEditTimes">
                <option v-for="choice in editEndDateChoices" :key="choice.label" :value="choice.label">{{ choice.label }}</option>
              </select>
            </div>
            <div class="date-time-group">
              <label for="editEndTime">End Time <span class="app-required-field">*</span></label>
              <select v-model="editingReservation.endTime" id="editEndTime" @change="validateEditTimes">
                <option v-for="choice in editEndTimeChoices" :key="choice" :value="choice">{{ choice }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div class="app-form-group">
          <label for="note">Note</label>
          <textarea v-model="editingReservation.note" id="note" placeholder="Add any additional information"></textarea>
        </div>
      </div>
      
      <div class="app-modal-footer">
        <button @click="confirmUpdate" class="app-btn app-btn-primary">Update</button>
        <button @click="cancelEdit" class="app-btn app-btn-secondary">Cancel</button>
        <button @click="confirmDelete(editingReservation)" class="app-btn app-btn-danger">Delete</button>
      </div>
    </div>
  </div>

  <!-- Reservation information modal -->
  <div v-if="showViewModal" class="app-modal-overlay">
    <div class="app-modal">
      <div class="app-modal-header">
        <h3>Reservation Information</h3>
      </div>
      <div class="app-modal-content">
        <div class="app-form-group">
          <label>Server</label>
          <div class="info-display">{{ viewingReservation.server }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Urgency</label>
          <div class="info-display">{{ viewingReservation.urgency }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Username</label>
          <div class="info-display">{{ viewingReservation.username }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Start</label>
          <div class="info-display">{{ viewingReservation.startDate }} {{ viewingReservation.startTime }}</div>
        </div>
        
        <div class="app-form-group">
          <label>End</label>
          <div class="info-display">{{ viewingReservation.endDate }} {{ viewingReservation.endTime }}</div>
        </div>
        
        <div class="app-form-group" v-if="viewingReservation && viewingReservation.note">
          <label>Note</label>
          <div class="info-display note">{{ viewingReservation.note }}</div>
        </div>
      </div>
      
      <div class="app-modal-footer">
        <button @click="closeViewModal" class="app-btn app-btn-secondary">Close</button>
      </div>
    </div>
  </div>

  <!-- Server Details Modal -->
  <div v-if="showServerDetailsModal" class="app-modal-overlay" @click.self="closeServerDetails">
    <div class="app-modal server-details-modal">
      <div class="app-modal-header">
        <h3>Server Details: {{ activeServer?.name }}</h3>
      </div>
      <div class="app-modal-content">
        <!-- Basic Server Information -->
        <div class="section-divider">Basic Information</div>
        
        <div class="app-form-group">
          <label>Name</label>
          <div class="info-display">{{ activeServer?.name }}</div>
        </div>
        
        <div class="app-form-group">
          <label>CPU Type</label>
          <div class="info-display">{{ activeServer?.cpuType || 'N/A' }}</div>
        </div>

        <div class="app-form-group">
          <label>IP Address</label>
          <div class="info-display">{{ formatIp(activeServer?.ip) }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Owner</label>
          <div class="info-display">{{ activeServer?.owner || 'N/A' }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Status</label>
          <div class="info-display">
            {{ formatStatus(activeServer?.status) }}
          </div>
        </div>
        
        <div class="app-form-group" v-if="activeServer?.location">
          <label>Location</label>
          <div class="info-display">{{ activeServer.location }}</div>
        </div>

        <div class="app-form-group" v-if="activeServer?.sudoUser">
          <label>Sudo Username</label>
          <div class="info-display">{{ activeServer.sudoUser }}</div>
        </div>

        <div class="app-form-group" v-if="activeServer?.sudoUserPassword && hasViewPermissions()">
          <label>Sudo Password</label>
          <div class="info-display password-field">
            {{ isPasswordVisible('sudo') ? activeServer.sudoUserPassword : '••••••••' }}
            <button
              class="toggle-password"
              @click="togglePasswordVisibility('sudo')"
              :title="isPasswordVisible('sudo') ? 'Hide sudo password' : 'Show sudo password'"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <div class="app-form-group" v-if="activeServer?.bmcIp">
          <label>BMC IP</label>
          <div class="info-display bmc-links-container">
            <a
              v-for="(ip, index) in parseBmcIps(activeServer.bmcIp)"
              :key="index"
              :href="`https://${ip}`"
              target="_blank"
              rel="noopener noreferrer"
              class="bmc-link"
            >
              {{ ip }}
            </a>
          </div>
        </div>

        <div class="app-form-group" v-if="activeServer?.bmcUser">
          <label>BMC Username</label>
          <div class="info-display">{{ activeServer.bmcUser }}</div>
        </div>

        <div class="app-form-group" v-if="activeServer?.bmcPassword && hasViewPermissions()">
          <label>BMC Password</label>
          <div class="info-display password-field">
            {{ isPasswordVisible('bmc') ? activeServer.bmcPassword : '••••••••' }}
            <button
              class="toggle-password"
              @click="togglePasswordVisibility('bmc')"
              :title="isPasswordVisible('bmc') ? 'Hide BMC password' : 'Show BMC password'"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
        </div>

        <div class="app-form-group" v-if="activeServer?.ubuntuVersion">
          <label>Ubuntu Version</label>
          <div class="info-display">{{ activeServer.ubuntuVersion }}</div>
        </div>

        <!-- Attached Devices Section -->
        <div v-if="serverAttachedDevices && serverAttachedDevices.length > 0">
          <div class="section-divider">Attached Devices</div>
          <div class="attached-devices-list">
            <div v-for="device in serverAttachedDevices" :key="device.id" class="attached-device">
              <div class="device-name">{{ device.name }}</div>
              <div class="device-type">{{ device.type || 'Unknown' }}</div>
            </div>
          </div>
        </div>
        
        <!-- System Specs -->
        <div class="section-divider">System Specifications</div>
        
        <div class="app-form-group">
          <label>CPU Frequency</label>
          <div class="info-display">{{ activeServer?.cpuFreq || 'N/A' }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Memory Slots</label>
          <div class="info-display">{{ activeServer?.memorySlots || 'N/A' }}</div>
        </div>
        
        <div class="app-form-group">
          <label>DIMM Type</label>
          <div class="info-display">{{ activeServer?.dimmType || 'N/A' }}</div>
        </div>
        
        <div class="app-form-group">
          <label>Number of DIMMs</label>
          <div class="info-display">{{ activeServer?.numDimms || 'N/A' }}</div>
        </div>
      </div>
      
      <div class="app-modal-footer">
        <button @click="reserveActiveServer" class="app-btn app-btn-primary">Reserve</button>
        <button @click="closeServerDetails" class="app-btn app-btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
import { firestore, getUserRole, auth, isAdmin, isUser } from '@/firebase'  // Added auth, isAdmin, isUser imports
import { collection, onSnapshot, updateDoc, deleteDoc, doc, query, where, orderBy, getDocs, runTransaction } from 'firebase/firestore'
import { dailyCache } from '@/utils/dailyCache'
import '@/assets/styles/common/modal-common.css' // Import common modal styles
import '@/assets/styles/common/common-ui.css' // Import common UI component styles
import '@/assets/styles/components/ReservationCalendar.css'

export default {
  name: 'ReservationCalendar',
  components: {},
  data() {
    return {
      allReservations: [],
      serversList: [],
      reservationsCollection: null,
      serverFilter: '',
      weekStart: new Date(),
      rowHeight: 35,
      unsubscribeReservations: null,

      showReservationForm: false,
      newReservation: {
        start: null,
        end: null,
        server: '',
        urgency: '',
        note: ''
      },
      startDateInput: '',
      startTimeInput: '',
      endDateInput: '',
      endTimeInput: '',
      startDateOffset: '',
      startTimeOffset: '',
      endDateOffset: '',
      endTimeOffset: '',

      showEditModal: false,
      editingReservation: null,

      showViewModal: false,
      viewingReservation: null,

      dragCreation: {
        active: false,
        server: null,
        day: null,
        startX: null,
        currentX: null,
        containerLeft: null,
        containerWidth: null,
        previewLeft: null,
        previewWidth: null
      },
      draggedReservation: null,
      draggedOriginalServer: null,
      dragPreviewPosition: {
        active: false,
        server: null,
        day: null,
        left: null,
        width: null,
        serverIndex: null
      },

      customDragActive: false,
      customDragReservation: null,
      customDragStartServer: null,
      customDragCurrentServer: null,
      customDragDay: null,
      customDragPreviewStyle: {},
      customDragInitialOffset: 0,
      customDragWidth: 0,
      customDragInitialRect: null,
      customDragStartTime: null,

      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragThreshold: 5,
      deviceFilter: '', // Add this new property for device filtering
      unifiedFilter: '', // Replace serverFilter and deviceFilter with unified filter

      // Add new properties for server details modal
      showServerDetailsModal: false,
      activeServer: null,
      serverAttachedDevices: [],
      showOnlyFavorites: false,
      favoriteServers: new Set(), // Add Set to track favorite server IDs
      userDocId: null, // Store the user document ID for updates
      visiblePasswords: new Set(), // Track visible passwords in server details modal
    }
  },
  computed: {
    currentUserEmail() {
      return auth.currentUser ? auth.currentUser.email : '';
    },
    currentUsername() {
      if (!this.currentUserEmail) return '';
      return this.currentUserEmail.split('@')[0];
    },
    // Updated to handle unified filtering and sort by name
    filteredServers() {
      let result = this.serversList;
      
      // First apply favorites filter if active
      if (this.showOnlyFavorites) {
        result = result.filter(server => this.isServerFavorite(server.id));
      }
      
      // Then apply search filter if specified
      if (this.unifiedFilter) {
        const filter = this.unifiedFilter.toLowerCase();
        
        result = result.filter(server => {
          // Filter by server name
          if (server.name && server.name.toLowerCase().includes(filter)) {
            return true;
          }
          
          // Filter by CPU type
          if (server.cpuType && server.cpuType.toLowerCase().includes(filter)) {
            return true;
          }
          
          // Filter by attached device name - FIX FOR DEVICE RESERVATION
          // First check direct attachments on server
          if (server.attachedDevices && server.attachedDevices.length && this.devicesList) {
            if (server.attachedDevices.some(deviceId => {
              const device = this.devicesList.find(d => d.id === deviceId);
              return device && device.name && device.name.toLowerCase().includes(filter);
            })) {
              return true;
            }
          }
          
          // Also check if any device with this name has this server in attachedServer
          if (this.devicesList && this.devicesList.length) {
            if (this.devicesList.some(device => 
              device.name && 
              device.name.toLowerCase().includes(filter) && 
              device.attachedServer === server.id
            )) {
              return true;
            }
          }
          
          return false;
        });
      }
      
      // Filter out unavailable servers (status is not "on")
      result = result.filter(server => server.status === 'on');
      
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

    // Sorted server list for dropdowns (same ordering as ServerList.vue)
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
    },

    serverWeekDays() {
      const days = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(this.weekStart)
        d.setDate(d.getDate() + i)
        days.push({ date: d })
      }
      return days
    },
    axisTimes() {
      return Array.from({ length: 24 }, (_, i) => i)
    },
    startDateChoices() {
      return this.genDateChoices(this.startDateInput)
    },
    endDateChoices(){
      return this.genDateChoices(this.endDateInput)
    },
    startTimeChoices() {
      const st = this.parseDateTime(this.startDateInput, this.startTimeInput);
      const en = this.parseDateTime(this.endDateInput, this.endTimeInput);
      if (!st || !en) return [];
      const arr = [];
      let cur = new Date(st.getTime() - 3 * 3600000);
      while (cur <= en) {
        const label = this.formatHhMmAmPm(cur);
        arr.push(label);
        cur = new Date(cur.getTime() + 30 * 60000);
      }
      return arr;
    },
    endTimeChoices(){
      const st = this.parseDateTime(this.startDateInput, this.startTimeInput);
      const en = this.parseDateTime(this.endDateInput, this.endTimeInput);
      if (!st || !en) return [];
      const arr = [];
      let cur = new Date(st.getTime());
      const endRange = new Date(en.getTime() + 3 * 3600000);
      while (cur <= endRange) {
        const label = this.formatHhMmAmPm(cur);
        arr.push(label);
        cur = new Date(cur.getTime() + 30 * 60000);
      }
      return arr;
    },
    editStartDateChoices() {
      return this.editingReservation ? this.genDateChoices(this.editingReservation.startDate) : [];
    },
    editEndDateChoices() {
      return this.editingReservation ? this.genDateChoices(this.editingReservation.endDate) : [];
    },
    editStartTimeChoices() {
      if (!this.editingReservation) return [];
      
      const st = this.parseDateTime(this.editingReservation.startDate, this.editingReservation.startTime);
      const en = this.parseDateTime(this.editingReservation.endDate, this.editingReservation.endTime);
      if (!st || !en) return [];
      
      const arr = [];
      let cur = new Date(st.getTime() - 3 * 3600000);
      while (cur <= en) {
        const label = this.formatHhMmAmPm(cur);
        arr.push(label);
        cur = new Date(cur.getTime() + 30 * 60000);
      }
      return arr;
    },
    editEndTimeChoices() {
      if (!this.editingReservation) return [];
      
      const st = this.parseDateTime(this.editingReservation.startDate, this.editingReservation.startTime);
      const en = this.parseDateTime(this.editingReservation.endDate, this.editingReservation.endTime);
      if (!st || !en) return [];
      
      const arr = [];
      let cur = new Date(st.getTime());
      const endRange = new Date(en.getTime() + 3 * 3600000);
      while (cur <= endRange) {
        const label = this.formatHhMmAmPm(cur);
        arr.push(label);
        cur = new Date(cur.getTime() + 30 * 60000);
      }
      return arr;
    },
    // Check if server has additional properties to display
    hasAdditionalProperties() {
      return this.activeServer && Object.keys(this.getAdditionalFields(this.activeServer)).length > 0;
    }
  },
  methods: {
    // Efficient Firebase-based conflict check
    async checkConflictEfficient(serverName, newStart, newEnd, newUrgency, excludeId = null) {
      try {
        // Query only reservations for the specific server that might overlap
        const conflictQuery = query(
          this.reservationsCollection,
          where('server', '==', serverName),
          where('start', '<', newEnd.toISOString()),
          orderBy('start', 'asc')
        );

        const snapshot = await getDocs(conflictQuery);
        const potentialConflicts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log(`Checking conflicts for ${serverName}: found ${potentialConflicts.length} potential conflicts`);

        for (const ev of potentialConflicts) {
          // Skip if this is the same reservation we're editing
          if (excludeId && ev.id === excludeId) continue;

          const evStart = new Date(ev.start);
          const evEnd = new Date(ev.end);

          // Check for actual time overlap
          if (newStart < evEnd && newEnd > evStart) {
            const existingUrg = (ev.urgency || '').toLowerCase();
            const newUrg = (newUrgency || '').toLowerCase();

            // Both must be co-run to allow overlap
            if (existingUrg !== 'co-run' || newUrg !== 'co-run') {
              console.log(`Conflict found: ${ev.username} (${ev.urgency}) vs new (${newUrgency})`);
              return true;
            }
          }
        }
        
        console.log('No conflicts found');
        return false;
      } catch (error) {
        console.error('Error checking conflicts:', error);
        // Fallback to memory-based check
        return this.checkConflictMemory(serverName, newStart, newEnd, newUrgency, excludeId);
      }
    },

    // Fallback memory-based conflict check
    checkConflictMemory(serverName, newStart, newEnd, newUrgency, excludeId = null) {
      const sameServerEvents = this.allReservations.filter(ev => 
        ev.server === serverName && (excludeId === null || ev.id !== excludeId)
      );

      for (const ev of sameServerEvents) {
        const evStart = new Date(ev.start);
        const evEnd = new Date(ev.end);

        if (newStart < evEnd && newEnd > evStart) {
          const existingUrg = (ev.urgency || '').toLowerCase();
          const newUrg = (newUrgency || '').toLowerCase();

          if (existingUrg !== 'co-run' || newUrg !== 'co-run') {
            return true;
          }
        }
      }
      return false;
    },
    
    // Transaction-based safe reservation creation
    async createReservationSafe(reservationData) {
      try {
        return await runTransaction(firestore, async (transaction) => {
          // Query for conflicting reservations within transaction
          const conflictQuery = query(
            this.reservationsCollection,
            where('server', '==', reservationData.server),
            where('start', '<', reservationData.end),
            orderBy('start', 'asc')
          );

          const conflictSnapshot = await getDocs(conflictQuery);
          const conflicts = conflictSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Check for conflicts
          const newStart = new Date(reservationData.start);
          const newEnd = new Date(reservationData.end);
          const newUrgency = (reservationData.urgency || '').toLowerCase();

          for (const conflict of conflicts) {
            const conflictStart = new Date(conflict.start);
            const conflictEnd = new Date(conflict.end);

            // Check for time overlap
            if (newStart < conflictEnd && newEnd > conflictStart) {
              const conflictUrgency = (conflict.urgency || '').toLowerCase();

              // Both must be co-run to allow overlap
              if (conflictUrgency !== 'co-run' || newUrgency !== 'co-run') {
                throw new Error(`Conflict with reservation by ${conflict.username} (${conflict.urgency})`);
              }
            }
          }

          // If no conflicts, create the reservation
          const newDocRef = doc(collection(firestore, 'reservations'));
          transaction.set(newDocRef, reservationData);
          
          return newDocRef.id;
        });
      } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
      }
    },
    
    // ISO date string conversion with timezone offset
    toLocalOffsetISOString(date) {
      const offsetMin = date.getTimezoneOffset()
      const sign = offsetMin > 0 ? '-' : '+'
      const absolute = Math.abs(offsetMin)
      const offsetHours = Math.floor(absolute / 60)
      const offsetMins = absolute % 60

      const pad = (n) => n.toString().padStart(2, '0')
      const year = date.getFullYear()
      const month = pad(date.getMonth() + 1)
      const day = pad(date.getDate())
      const hour = pad(date.getHours())
      const minute = pad(date.getMinutes())
      const second = pad(date.getSeconds())
      const offH = pad(offsetHours)
      const offM = pad(offsetMins)
      return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offH}:${offM}`
    },

    // Date and time formatting functions - consolidated
    formatAxisHour(h) {
      return new Date(2000, 0, 1, h).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    },
    
    formatMmmDdYyyy(d) {
      return d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
    },
    
    formatHhMmAmPm(d) {
      return d.toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit', hour12:true});
    },
    
    formatDayHeader(d) {
      const weekday = d.toLocaleDateString('en-US', {weekday:'short'});
      const monthDay = d.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      return `${weekday} (${monthDay})`;
    },
    
    formatWeekRange(startDate) {
      const endDate = this.addDays(startDate, 6);
      const startMonth = startDate.toLocaleDateString('en-US', {month:'short'});
      const endMonth = endDate.toLocaleDateString('en-US', {month:'short'});
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      if (startMonth !== endMonth || startYear !== endYear) {
        return `${startMonth} ${startDay}${startYear !== endYear ? `, ${startYear}:` : ''} - ${endMonth} ${endDay}, ${endYear}`;
      }
      return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
    },

    
    // Combined time indicator style functions
    getTimeIndicatorStyle(dayDate, type) {
      const now = new Date();
      if (!this.isSameDay(now, dayDate)) return {};
      
      const hours = now.getHours() + now.getMinutes() / 60;
      const leftPercent = (hours / 24) * 100;
      
      if (type === 'arrow') {
        return {
          position: 'absolute',
          top: '-10px',
          left: `calc(${leftPercent}% - 2.5px)`,
          width: '0',
          height: '0',
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '10px solid red'
        };
      } else if (type === 'line') {
        return {
          position: 'absolute',
          top: '0',
          bottom: '0',
          left: `calc(${leftPercent}%)`,
          width: '2px',
          background: 'linear-gradient(to bottom, rgba(220, 53, 69, 0.8), rgba(220, 53, 69, 0.6))',
          zIndex: 5,
          boxShadow: '0 0 8px rgba(220, 53, 69, 0.4)'
        };
      }
      
      return {};
    },
    
    // Use the combined function for both arrow and line
    currentTimeArrowStyle(dayDate) {
      return this.getTimeIndicatorStyle(dayDate, 'arrow');
    },
    
    currentTimeLineStyle(dayDate) {
      return this.getTimeIndicatorStyle(dayDate, 'line');
    },
    
    // Date helper functions
    addDays(dt, days) {
      const d = new Date(dt);
      d.setDate(d.getDate() + days);
      return d;
    },
    
    isSameDay(d1, d2) {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    },
    
    moveWeek(offset) {
      const newDate = new Date(this.weekStart);
      newDate.setDate(newDate.getDate() + offset * 7);
      this.weekStart = newDate;
      
      // Reload reservations for the new week
      this.reloadReservations();
    },
    
    // Reload reservations when week changes
    reloadReservations() {
      // Unsubscribe from current listener
      if (this.unsubscribeReservations) {
        this.unsubscribeReservations();
      }
      
      // Load reservations for new week
      this.loadReservations();
    },

    // Hour and minute snapping functions - consolidated
    snapHoursTo00_15_30_45(h) {
      let totalMinutes = Math.round(h * 60);
      const hour = Math.floor(totalMinutes / 60);
      let minutes = totalMinutes % 60;
      
      // Snap minutes to 0 or 30
      if (minutes >= 0 && minutes <= 25) minutes = 0;
      else if (minutes > 25 && minutes <= 55) minutes = 30;
      else minutes = 60;
      
      return hour + minutes / 60;
    },

    // Parse date and time strings into Date object
    parseDateTime(dateS, timeS) {
      try {
        if (!dateS || !timeS) return null;
        
        const dateObj = new Date(dateS);
        if (dateObj.toString() === 'Invalid Date') return null;

        const timeParts = timeS.trim().split(' ');
        if (timeParts.length !== 2) return null;
        
        const [time, period] = timeParts;
        let [hours, minutes] = time.split(':').map(Number);
        
        if (isNaN(hours) || isNaN(minutes)) return null;
        
        const upperPeriod = period.toUpperCase();
        if (upperPeriod === 'PM' && hours !== 12) hours += 12;
        if (upperPeriod === 'AM' && hours === 12) hours = 0;
        
        dateObj.setHours(hours, minutes, 0, 0);
        return dateObj;
      } catch (err) {
        console.error('Error parsing date/time:', err);
        return null;
      }
    },

    // Generate date choices for dropdowns
    genDateChoices(inputStr) {
      const base = this.parseDateTime(inputStr, '12:00 PM');
      if (!base) return [];
      
      const arr = [];
      for (const offset of [-2, -1, 0, 1, 2]) {
        const dd = new Date(base);
        dd.setDate(dd.getDate() + offset);
        arr.push({
          value: offset,
          label: this.formatMmmDdYyyy(dd)
        });
      }
      return arr;
    },

    // Combined validation function for both new and edit forms
    validateDateTimes(startDateInput, startTimeInput, endDateInput, endTimeInput) {
      const start = this.parseDateTime(startDateInput, startTimeInput);
      const end = this.parseDateTime(endDateInput, endTimeInput);
      
      if (!start || !end) {
        console.warn('Invalid date/time format');
        return { valid: false, message: 'Invalid date/time format' };
      }
      
      if (start >= end) {
        return { valid: false, message: 'End time must be after start time' };
      }
      
      return { valid: true, start, end };
    },
    
    // Call the combined validation function
    validateTimes() {
      const result = this.validateDateTimes(
        this.startDateInput,
        this.startTimeInput, 
        this.endDateInput,
        this.endTimeInput
      );
      
      if (!result.valid && result.message) {
        alert(result.message);
      }
    },
    
    validateEditTimes() {
      if (!this.editingReservation) return;
      
      const result = this.validateDateTimes(
        this.editingReservation.startDate,
        this.editingReservation.startTime,
        this.editingReservation.endDate,
        this.editingReservation.endTime
      );
      
      if (!result.valid && result.message) {
        alert(result.message);
      }
      
      this.$forceUpdate();
    },

    // Consolidated reservation update function
    async updateReservation(evt, directUpdate = false) {
      // Skip if not a direct update
      if (!directUpdate) return false;
      
      const start = new Date(evt.start);
      const end = new Date(evt.end);
      
      // Check for conflicts
      if (await this.checkConflictEfficient(evt.server, start, end, evt.urgency, evt.id)) {
        alert('Conflict: overlapping on the same server, not all open to co-run.');
        return false;
      }
      
      // Update in database
      const docRef = doc(firestore, 'reservations', evt.id);
      try {
        const updateData = {
          title: evt.title,
          server: evt.server,
          start: this.toLocalOffsetISOString(start),
          end: this.toLocalOffsetISOString(end)
        };
        
        // Add additional fields if provided
        if (evt.urgency !== undefined) updateData.urgency = evt.urgency;
        if (evt.note !== undefined) updateData.note = evt.note;
        
        await updateDoc(docRef, updateData);
        console.log('Updated reservation');
        return true;
      } catch (error) {
        console.error('Error updating reservation:', error);
        return false;
      }
    },

    // Use the combined update function for silent updates too
    updateReservationSilent(evt) {
      return this.updateReservation(evt, true);
    },

    // Handling for both new and existing reservations
    async saveReservation(isNew = true) {
      const reservationData = isNew ? this.newReservation : this.editingReservation;
      
      // Common validation
      if (!reservationData.server || !reservationData.urgency) {
        alert('Server and Urgency are required.');
        return;
      }
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        alert('You must be logged in to create reservations.');
        return;
      }
      
      // Check if username is available
      if (!this.currentUsername) {
        alert('Username is required but not available. Please refresh and try again.');
        return;
      }
      
      // Parse dates
      let start, end;
      
      if (isNew) {
        const validation = this.validateDateTimes(
          this.startDateInput, 
          this.startTimeInput,
          this.endDateInput,
          this.endTimeInput
        );
        
        if (!validation.valid) {
          alert(validation.message);
          return;
        }
        
        start = validation.start;
        end = validation.end;
      } else {
        start = this.parseDateTime(
          reservationData.startDate, 
          reservationData.startTime
        );
        end = this.parseDateTime(
          reservationData.endDate,
          reservationData.endTime
        );
        
        if (!start || !end) {
          alert('Invalid date/time format.');
          return;
        }
        
        if (start >= end) {
          alert('End time must be after start time.');
          return;
        }
      }
      
      try {
        if (isNew) {
          // Create new reservation using safe transaction
          const originalTitle = `${reservationData.server} (${reservationData.urgency})`;
          
          const reservationDoc = {
            title: originalTitle,
            start: this.toLocalOffsetISOString(start),
            end: this.toLocalOffsetISOString(end),
            server: reservationData.server,
            urgency: reservationData.urgency,
            note: reservationData.note || '',
            username: this.currentUsername
          };
          
          if (!this.currentUsername) {
            throw new Error('Username is required but not available');
          }
          
          if (!this.reservationsCollection) {
            throw new Error('Reservations collection is not initialized');
          }
          
          // Use transaction-based safe creation instead of regular addDoc
          const newReservationId = await this.createReservationSafe(reservationDoc);
          console.log('Safely created reservation with ID:', newReservationId);
          
          // Close form and cleanup FIRST
          this.showReservationForm = false;
          this.dragCreation.active = false;
          
          // Reset form after closing
          this.newReservation = {
            start: null,
            end: null,
            server: '',
            urgency: '',
            note: ''
          };
          this.startDateInput = '';
          this.startTimeInput = '';
          this.endDateInput = '';
          this.endTimeInput = '';
        } else {
          // Update existing reservation - check for conflicts first
          if (await this.checkConflictEfficient(
            reservationData.server, 
            start, 
            end, 
            reservationData.urgency,
            reservationData.id
          )) {
            alert('Conflict: overlapping on the same server, not all open to co-run.');
            return;
          }
          
          const originalTitle = `${reservationData.server} (${reservationData.urgency})`;
          
          const docRef = doc(firestore, 'reservations', reservationData.id);
          await updateDoc(docRef, {
            title: originalTitle,
            server: reservationData.server,
            start: this.toLocalOffsetISOString(start),
            end: this.toLocalOffsetISOString(end),
            urgency: reservationData.urgency,
            note: reservationData.note || ''
          });
          
          // Close form
          this.showEditModal = false;
          this.editingReservation = null;
        }
      } catch (error) {
        console.error('=== FIREBASE ERROR DEBUG ===');
        console.error(`Error ${isNew ? 'creating' : 'updating'} reservation:`, error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
        
        // Check authentication status
        console.error('Auth status - currentUser:', auth.currentUser);
        console.error('Auth status - currentUserEmail:', this.currentUserEmail);
        console.error('Auth status - currentUsername:', this.currentUsername);
        
        // Handle different error types with user-friendly messages
        if (error.message && error.message.includes('Conflict with reservation')) {
          // This is a conflict detected by our transaction
          alert(`Reservation conflict: ${error.message.split('Conflict with reservation by ')[1]}. Please choose a different time or make it co-run compatible.`);
        } else if (error.code === 'permission-denied') {
          alert('Permission denied: You may not have the required permissions to create reservations. Please check with your administrator.');
        } else if (error.code === 'unauthenticated') {
          alert('Authentication required: Please log out and log back in, then try again.');
        } else if (error.message && error.message.includes('400')) {
          alert('Firebase request failed (400): This is likely a permissions or authentication issue. Please try logging out and back in.');
        } else {
          alert(`Firebase ${isNew ? 'create' : 'update'} failed: ${error.message}`);
        }
        
        // Keep modal open on error so user can fix the issue
      }
    },
    
    // Call the combined save function instead of separate functions
    confirmReservation() {
      this.saveReservation(true);
    },
    
    confirmUpdate() {
      this.saveReservation(false);
    },

    prefillDateTimeInputs(st,en){
      this.startDateInput=this.formatMmmDdYyyy(st)
      this.startTimeInput=this.formatHhMmAmPm(st)
      this.endDateInput=this.formatMmmDdYyyy(en)
      this.endTimeInput=this.formatHhMmAmPm(en)
    },

    applyDateOffsetForDate(val, which){
      if(!val)return
      const offset=parseInt(val)
      if(isNaN(offset))return
      const base = (which==='start')
        ? this.parseDateTime(this.startDateInput, '12:00 PM')
        : this.parseDateTime(this.endDateInput, '12:00 PM')
      if(!base){
        alert('Invalid date to shift.')
        return
      } 
      base.setDate(base.getDate()+offset)
      if(which==='start'){
        this.startDateInput=this.formatMmmDdYyyy(base)
      }else{
        this.endDateInput=this.formatMmmDdYyyy(base)
      }
    },

    genTimeChoices(inputStr){
      const base=this.parseDateTime('Jun 01, 2025', inputStr)
      if(!base)return []
      const arr=[]
      for(let m=-12*60; m<=12*60; m+=15){
        const dd=new Date(base)
        dd.setMinutes(dd.getMinutes()+m)
        const label=dd.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})
        arr.push({ value:m, label:`${m} min => ${label}`})
      }
      return arr
    },
    applyTimeOffset(val, which){
      if(!val)return 
      const offsetM=parseInt(val)
      if(isNaN(offsetM))return
      const base= this.parseDateTime('Jun 01, 2025', (which==='start'?this.startTimeInput:this.endTimeInput))
      if(!base){
        alert('Invalid time to shift.')
        return
      }
      base.setMinutes(base.getMinutes()+offsetM)
      const newLabel=base.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})
      if(which==='start'){
        this.startTimeInput=newLabel
      } else {
        this.endTimeInput=newLabel
      }
    },

    cancelReservation(){
      this.showReservationForm=false
      this.dragCreation.active=false
    },

    // Update reservation when Update button is clicked
    async confirmDelete(res){
      this.showEditModal=false
      if(confirm(`Delete reservation '${res.title}'?`)){
        try{
          const docRef=doc(firestore,'reservations',res.id)
          await deleteDoc(docRef)
          console.log('Reservation deleted.')
        }catch(err){
          console.error('Error deleting reservation:',err)
        }
      }
      this.editingReservation=null
    },
    async promptChangePeriod(){
      this.showEditModal=false
      const ns=prompt('Enter new start time (YYYY-MM-DDTHH:MM)',this.editingReservation.start)
      const ne=prompt('Enter new end time (YYYY-MM-DDTHH:MM)',this.editingReservation.end)
      if(!ns||!ne)return
      try{
        const docRef=doc(firestore,'reservations',this.editingReservation.id)
        await updateDoc(docRef,{
          start:this.toLocalOffsetISOString(new Date(ns)),
          end:this.toLocalOffsetISOString(new Date(ne))
        })
        console.log('server-type changed in local offset.')
      }catch(err){
        console.error('Error updating reservation period:',err)
      }
      this.editingReservation=null
    },
    cancelEdit(){
      this.showEditModal=false
      this.editingReservation=null
    },

    closeViewModal() {
      this.showViewModal = false;
      this.viewingReservation = null;
    },

    async loadServers(){
      try {
        this.serversList = await dailyCache.loadData('servers');
        console.log('Loaded servers:', this.serversList.length);
      } catch (err) {
        console.error('Error loading servers:', err);
        this.serversList = [];
      }
    },
    loadReservations(){
      this.reservationsCollection=collection(firestore,'reservations')
      
      // Optimized: Load reservations that overlap with current viewing week
      // Need to get reservations that either:
      // 1. Start during the week
      // 2. End during the week  
      // 3. Span across the entire week
      // Since Firebase doesn't support OR queries directly, we query a wider range
      const weekStart = new Date(this.weekStart);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Query reservations that start before week end (to catch long reservations)
      // Extend the query range to catch reservations that might span multiple weeks/months
      const extendedStart = new Date(weekStart);
      extendedStart.setDate(extendedStart.getDate() - 30); // Look back 30 days for very long reservations
      
      console.log(`Loading reservations for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
      console.log(`Extended query range: ${extendedStart.toISOString()} to ${weekEnd.toISOString()}`);
      
      const reservationsQuery = query(
        this.reservationsCollection,
        where('start', '>=', extendedStart.toISOString()),
        where('start', '<', weekEnd.toISOString()),
        orderBy('start', 'asc')
      );
      
      this.unsubscribeReservations = onSnapshot(reservationsQuery,snap=>{
        const rawReservations = snap.docs.map(d=>{
          const dd=d.data()
          // Set class names array
          const classNames = [this.getUrgencyColorClass(dd.urgency)];
          // Add my-reservation class if it's my reservation
          if (dd.username === this.currentUsername) {
            classNames.push('my-reservation');
          }
          
          return {
            id:d.id,
            title: dd.title,  // Keep original title
            start:dd.start,
            end:dd.end,
            server:dd.server,
            urgency:dd.urgency,
            note:dd.note,
            username:dd.username,
            className: classNames // Set class names array
          }
        })
        
        // Filter reservations that actually overlap with the current week
        this.allReservations = rawReservations.filter(reservation => {
          const resStart = new Date(reservation.start);
          const resEnd = new Date(reservation.end);
          
          // Check if reservation overlaps with current week
          // Overlap condition: reservation starts before week ends AND reservation ends after week starts
          return resStart < weekEnd && resEnd > weekStart;
        });
        
        console.log(`Filtered ${this.allReservations.length} reservations from ${rawReservations.length} total reservations for current week`);
        
        // Cleanup old reservations weekly (only on Sundays)
        const today = new Date();
        if (today.getDay() === 0) { // Sunday = 0
          this.cleanupOldReservations();
        }
        
        console.log('Fetched reservations:',this.allReservations)
      },err=>console.error('Error fetching reservations:',err))
    },

    // Automatically delete reservations older than 3 months
    async cleanupOldReservations() {
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const oldReservations = this.allReservations.filter(reservation => {
          const reservationEnd = new Date(reservation.end);
          return reservationEnd < threeMonthsAgo;
        });
        
        if (oldReservations.length > 0) {
          console.log(`Found ${oldReservations.length} old reservations to delete`);
          
          for (const reservation of oldReservations) {
            const reservationRef = doc(firestore, 'reservations', reservation.id);
            await deleteDoc(reservationRef);
          }
          
          console.log(`Successfully deleted ${oldReservations.length} old reservations`);
        }
      } catch (error) {
        console.error('Error cleaning up old reservations:', error);
      }
    },


    openReservationForm() {
      this.newReservation = {
        start: null,
        end: null,
        server: '',
        urgency: '',
        note: ''
      };
      const now = new Date();
      const snappedHours = this.snapHoursTo00_15_30_45(now.getHours() + now.getMinutes() / 60);
      const snappedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.floor(snappedHours), Math.round((snappedHours - Math.floor(snappedHours)) * 60), 0, 0);
      this.prefillDateTimeInputs(snappedDate, new Date(snappedDate.getTime() + 3600000));
      this.showReservationForm = true;
    },

    

    /** For server-type view */
    getReservationsForServerAndDay(srv, dd){
      return this.allReservations.filter(r=>{
        if(r.server!==srv.name) return false
        
        const rs = new Date(r.start)
        const re = new Date(r.end)
        
        const dayStart = new Date(dd)
        dayStart.setHours(0, 0, 0, 0)
        
        const dayEnd = new Date(dd)
        dayEnd.setHours(23, 59, 59, 999)
        
        // Check if reservation overlaps with the day
        return (rs <= dayEnd && re > dayStart)
      })
    },
    
    getReservationStyle(r, dd){
      const st=new Date(r.start)
      const en=new Date(r.end)

      const ds=new Date(dd); ds.setHours(0,0,0,0)
      const de=new Date(dd); de.setHours(24,0,0,0)
      const effS=st<ds?ds:st
      const effE=en>de?de:en
      
      // Calculate start hour as before
      const sh=effS.getHours()+effS.getMinutes()/60
      
      // Improved handling for end time across date boundaries (including month boundaries)
      let eh = effE.getHours()+effE.getMinutes()/60
      
      // Check if effective end time extends beyond the current day
      if (effE.getTime() >= de.getTime()) {
        eh = 24  // If reservation extends to or beyond end of day, show until end of day
      } else if (eh === 0 && effE > ds) {
        // If end time is midnight but reservation extends beyond day start, treat as full day
        eh = 24
      }
      
      const leftP=(sh/24)*100
      const wP=((eh-sh)/24)*100
      
      // Debug logging for cross-month reservations
      if (st.getMonth() !== en.getMonth() || st.getDate() !== en.getDate()) {
        console.log(`Cross-date reservation debugging:`, {
          username: r.username,
          server: r.server,
          originalStart: r.start,
          originalEnd: r.end,
          viewingDay: dd.toDateString(),
          effectiveStart: effS.toISOString(),
          effectiveEnd: effE.toISOString(),
          startHour: sh,
          endHour: eh,
          leftPercent: leftP,
          widthPercent: wP
        });
      }
      
      return {left:`${leftP}%`, width:`${wP}%`}
    },
    
    handleReservationClick(r){
      const startDate = this.formatMmmDdYyyy(new Date(r.start));
      const startTime = this.formatHhMmAmPm(new Date(r.start));
      const endDate = this.formatMmmDdYyyy(new Date(r.end));
      const endTime = this.formatHhMmAmPm(new Date(r.end));
      
      const reservationData = {
        ...r,
        startDate,
        startTime,
        endDate,
        endTime
      };
      
      // Check if it's current user's reservation
      if (r.username === this.currentUsername) {
        // Show edit modal if it's current user's reservation
        this.editingReservation = null;
        
        this.$nextTick(() => {
          this.editingReservation = reservationData;
          this.showEditModal = true;
        });
      } else {
        // Show view modal if it's another user's reservation
        this.viewingReservation = null;
        
        this.$nextTick(() => {
          this.viewingReservation = reservationData;
          this.showViewModal = true;
        });
      }
    },
    
    /** Drag creation functions */
    handleTimelineContainerMousedown(dayDate,e){
      if(e.target.closest('.reservation'))return
      e.preventDefault()
      this.startDragCreation(null,dayDate,e)
    },
    
    handleReservationContainerMousedown(srv,dayDate,e){
      if(e.target.closest('.reservation'))return
      e.preventDefault()
      this.startDragCreation(srv,dayDate,e)
    },
    
    startDragCreation(server,day,e){
      const rect=e.currentTarget.getBoundingClientRect()
      this.dragCreation={
        active:true,server,day,
        startX:e.clientX, currentX:e.clientX,
        containerLeft:rect.left, containerWidth:rect.width
      }
      window.addEventListener('mousemove', this.onDragCreationMove)
      window.addEventListener('mouseup',this.onDragCreationEnd)
    },
    
    onDragCreationMove(e) {
      if (!this.dragCreation.active) return;

      const { startX, containerLeft, containerWidth } = this.dragCreation;

      const pointerX   = e.clientX - containerLeft;
      const initialX   = startX - containerLeft;

      let startFrac    = initialX / containerWidth;
      let endFrac      = pointerX / containerWidth;
      let hoursStart   = 24 * startFrac;
      let hoursEnd     = 24 * endFrac;

      hoursStart = this.snapHoursTo00_15_30_45(hoursStart);
      hoursEnd   = this.snapHoursTo00_15_30_45(hoursEnd);

      const newStartPx = (hoursStart / 24) * containerWidth;
      const newEndPx   = (hoursEnd   / 24) * containerWidth;

      const snappedLeftPx  = Math.min(newStartPx, newEndPx);
      const snappedRightPx = Math.max(newStartPx, newEndPx);
      const snappedWidth   = snappedRightPx - snappedLeftPx;

      this.dragCreation.currentX = e.clientX;
      this.dragCreation.previewLeft  = snappedLeftPx;
      this.dragCreation.previewWidth = snappedWidth;
      this.dragCreation.snappedStartPx = snappedLeftPx;
      this.dragCreation.snappedEndPx   = snappedRightPx;
    },
    
    onDragCreationEnd(){
      if(!this.dragCreation.active)return
      window.removeEventListener('mousemove',this.onDragCreationMove)
      window.removeEventListener('mouseup',this.onDragCreationEnd)
      const {startX, currentX, snappedStartPx,snappedEndPx,containerLeft,containerWidth,day,server}=this.dragCreation

      const rawStartPx=Math.min(snappedStartPx,snappedEndPx)
      const rawEndPx=Math.max(snappedStartPx,snappedEndPx)
      const startFrac=(rawStartPx)/containerWidth
      const endFrac=(rawEndPx)/containerWidth
      if((startX - currentX) < 3 && (currentX - startX) < 3){
        let px = startX - containerLeft
        let fraction = px / containerWidth
        let hours=24*fraction
        hours=this.snapHoursTo00_15_30_45(hours)
        const st=new Date(day)
        st.setHours(Math.floor(hours), Math.round((hours-Math.floor(hours))*60),0,0)
        const en=new Date(st.getTime()+30*60000)

        const newStartPx = (hours / 24) * containerWidth;
        this.dragCreation.previewLeft  = newStartPx;
        this.dragCreation.previewWidth = (0.5 / 24) * containerWidth;

        this.newReservation.server=server?server.name:''
        this.newReservation.start=st
        this.newReservation.end=en
        this.newReservation.urgency=''
        this.newReservation.note=''
        this.prefillDateTimeInputs(st,en)
        this.showReservationForm=true
      }else{
        let hs=24*startFrac
        let he=24*endFrac
        hs=this.snapHoursTo00_15_30_45(hs)
        he=this.snapHoursTo00_15_30_45(he)
        const finalS=new Date(day)
        finalS.setHours(Math.floor(hs),Math.round((hs-Math.floor(hs))*60),0,0)
        const finalE=new Date(day)
        finalE.setHours(Math.floor(he),Math.round((he-Math.floor(he))*60),0,0)
        this.newReservation.server=server?server.name:''
        this.newReservation.start=finalS
        this.newReservation.end=finalE
        this.newReservation.urgency=''
        this.newReservation.note=''
        this.prefillDateTimeInputs(finalS, finalE)
        this.showReservationForm=true
      }
    },
    
    getDragPreviewStyle(){
      if(!this.dragCreation.active)return {}
      if(this.dragCreation.previewLeft==null || this.dragCreation.previewWidth==null){
        let left=Math.min(this.dragCreation.startX, this.dragCreation.currentX)-this.dragCreation.containerLeft
        if(left<0)left=0
        const width=Math.abs(this.dragCreation.currentX-this.dragCreation.startX)
        return {left:left+'px', width:width+'px'}
      }
      return {
        left:this.dragCreation.previewLeft+'px',
        width:this.dragCreation.previewWidth+'px'
      }
    },

    // Drag-related functions
    handleDragOver(e, srv, day) {
      if (!this.draggedReservation) return;
      
      e.preventDefault();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      let fraction = px / rect.width;
      
      let hours = 24 * fraction;
      hours = this.snapHoursTo00_15_30_45(hours);
      
      const originalStart = new Date(this.draggedReservation.start);
      const originalEnd = new Date(this.draggedReservation.end);
      const duration = (originalEnd - originalStart) / (1000 * 60 * 60);

      const leftPercent = (hours / 24) * 100;
      const widthPercent = (duration / 24) * 100;
      
      this.dragPreviewPosition = {
        active: true,
        server: srv,
        day: day,
        left: leftPercent,
        width: widthPercent,
        serverIndex: this.filteredServers.findIndex(s => s.id === srv.id)
      };
    },
    
    isDraggingOver(srv, day) {
      return this.dragPreviewPosition.active && 
             this.dragPreviewPosition.server.id === srv.id && 
             this.isSameDay(this.dragPreviewPosition.day, day);
    },
    
    getDragGridPreviewStyle() {
      if (!this.dragPreviewPosition.active) return {};
      
      return {
        left: `${this.dragPreviewPosition.left}%`,
        width: `${this.dragPreviewPosition.width}%`,
        top: '5px',
        height: '25px'
      };
    },
    
    // Modified to validate ownership in onDrop
    async onDrop(e, srv, dayDate) {
      if (!this.draggedReservation) return;
      
      // Check if current user is the owner of this reservation
      if (this.draggedReservation.username !== this.currentUsername) {
        alert("You can only modify your own reservations.");
        this.draggedReservation = null;
        this.draggedOriginalServer = null;
        this.dragPreviewPosition.active = false;
        return;
      }
      
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      let fraction = px / rect.width;
      let hours = 24 * fraction;
      hours = this.snapHoursTo00_15_30_45(hours);
      
      const newStart = new Date(dayDate);
      newStart.setHours(Math.floor(hours), Math.round((hours - Math.floor(hours)) * 60), 0, 0);
      
      const os = new Date(this.draggedReservation.start);
      const oe = new Date(this.draggedReservation.end);
      const dur = oe - os;
      const newEnd = new Date(newStart.getTime() + dur);
      
      // Check for conflicts
      if (await this.checkConflictEfficient(
        srv.name, 
        newStart, 
        newEnd, 
        this.draggedReservation.urgency, 
        this.draggedReservation.id
      )) {
        alert('Conflict: overlapping on the same server, not all open to co-run.');
        return;
      }
      
      const updatedTitle = `${srv.name} (${this.draggedReservation.urgency})`;
      
      const updated = {
        ...this.draggedReservation,
        title: updatedTitle,
        server: srv.name,
        start: this.toLocalOffsetISOString(newStart),
        end: this.toLocalOffsetISOString(newEnd)
      };
      
      this.updateReservation(updated, true);
      this.draggedReservation = null;
      this.draggedOriginalServer = null;
      this.dragPreviewPosition.active = false;
    },

    // Modified to check ownership before allowing custom drag
    startCustomDrag(reservation, server, day, e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if current user is the owner of this reservation
      if (reservation.username !== this.currentUsername) {
        // Just open the view modal instead of starting a drag
        this.handleReservationClick(reservation);
        return;
      }
      
      const reservationElement = e.currentTarget;
      const rect = reservationElement.getBoundingClientRect();
      
      // ...rest of the existing custom drag setup code...
      const start = new Date(reservation.start);
      const end = new Date(reservation.end);
      const duration = (end - start) / (1000 * 60 * 60);
      
      this.customDragInitialOffset = e.clientX - rect.left;
      
      this.customDragActive = true;
      this.customDragReservation = reservation;
      this.customDragStartServer = server;
      this.customDragCurrentServer = server;
      this.customDragDay = day;
      this.customDragWidth = duration;
      this.customDragInitialRect = rect;
      this.customDragStartTime = start;
      
      console.log('[Drag Start] Server:', server.name, 'Day:', this.formatMmmDdYyyy(day));
      
      this.isDragging = false;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      
      this.customDragPreviewStyle = {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        background: 'rgba(255, 165, 0, 0.7)',
        border: '2px dashed #ff8c00',
        zIndex: 9999,
        pointerEvents: 'none',
        borderRadius: '3px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        display: 'block',
        transition: 'top 0.1s ease-out'
      };
      
      window.addEventListener('mousemove', this.handleCustomDragMove);
      window.addEventListener('mouseup', this.handleCustomDragEnd);
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    },
    
    handleCustomDragMove(e) {
      if (!this.customDragActive) return;
      
      const deltaX = Math.abs(e.clientX - this.dragStartX);
      const deltaY = Math.abs(e.clientY - this.dragStartY);
      
      if (!this.isDragging && (deltaX > this.dragThreshold || deltaY > this.dragThreshold)) {
        this.isDragging = true;
        console.log('Dragging started');
      }
      
      const daySections = document.querySelectorAll('.day-section');
      let targetTimeline = null;
      let targetDay = null;
      let targetServer = null;
      let minDistance = Infinity;
      
      daySections.forEach((daySection, dayIndex) => {
        const timelineElement = daySection.querySelector('.timeline');
        
        if (timelineElement) {
          const timelineRect = timelineElement.getBoundingClientRect();
          
          if (e.clientX >= timelineRect.left && e.clientX <= timelineRect.right) {
            const relativeY = e.clientY - timelineRect.top;
            const serverIndex = Math.floor(relativeY / this.rowHeight);
            
            if (serverIndex >= 0 && serverIndex < this.filteredServers.length) {
              const serverRowTop = timelineRect.top + serverIndex * this.rowHeight;
              const serverRowBottom = serverRowTop + this.rowHeight;
              const distanceToRow = Math.min(
                Math.abs(e.clientY - serverRowTop),
                Math.abs(e.clientY - serverRowBottom)
              );
              
              if (distanceToRow < minDistance) {
                minDistance = distanceToRow;
                targetTimeline = timelineElement;
                targetDay = this.serverWeekDays[dayIndex].date;
                targetServer = this.filteredServers[serverIndex];
              }
            }
          }
        }
      });
      
      if (targetTimeline && targetServer) {
        const rect = targetTimeline.getBoundingClientRect();
        
        let relativeX = e.clientX - rect.left;
        if (relativeX < 0) relativeX = 0;
        if (relativeX > rect.width) relativeX = rect.width;
        
        const fraction = relativeX / rect.width;
        let hours = 24 * fraction;
        hours = this.snapHoursTo00_15_30_45(hours);
        
        const serverIndex = this.filteredServers.findIndex(s => s.id === targetServer.id);
        
        const leftPercent = (hours / 24);
        const newLeft = rect.left + leftPercent * rect.width;
        const newTop = rect.top + (serverIndex >= 0 ? serverIndex * this.rowHeight : 0) + 5;
        const newWidth = this.customDragWidth * rect.width / 24;
        
        this.customDragPreviewStyle = {
          ...this.customDragPreviewStyle,
          left: `${newLeft}px`,
          top: `${newTop}px`,
          width: `${newWidth}px`,
          height: '25px',
          transition: 'top 0.1s ease-out'
        };
        
        if (this.customDragCurrentServer !== targetServer || 
            !this.isSameDay(this.customDragDay, targetDay)) {
          console.log('[Drag Move] Changing to:', 
                     'Server:', targetServer.name,
                     'Day:', this.formatMmmDdYyyy(targetDay));
          
          this.customDragCurrentServer = targetServer;
          this.customDragDay = targetDay;
        }
      }
      
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    },
    
    // Modified handleCustomDragEnd to check ownership again before saving
    async handleCustomDragEnd() {
      if (!this.customDragActive) return;
      
      window.removeEventListener('mousemove', this.handleCustomDragMove);
      window.removeEventListener('mouseup', this.handleCustomDragEnd);
      
      // Verify ownership again as a safeguard
      if (this.customDragReservation && 
          this.customDragReservation.username !== this.currentUsername) {
        this.customDragActive = false;
        this.customDragReservation = null;
        this.customDragStartServer = null;
        this.customDragCurrentServer = null;
        this.customDragDay = null;
        this.isDragging = false;
        this.customDragInitialRect = null;
        alert("You can only modify your own reservations.");
        return;
      }
      
      const dragDistance = Math.sqrt(
        Math.pow(this.lastMouseX - this.dragStartX, 2) + 
        Math.pow(this.lastMouseY - this.dragStartY, 2)
      );
      
      // ...rest of the existing drag end handling...
      if (dragDistance <= this.dragThreshold * 1) {
        this.handleReservationClick(this.customDragReservation);
      } 
      else if (this.isDragging && this.customDragReservation && 
               this.customDragDay && this.customDragCurrentServer) {
        
        console.log('[Drag End] Final position:', 
                   'Server:', this.customDragCurrentServer.name, 
                   'Day:', this.formatMmmDdYyyy(this.customDragDay));
        
        const dayIndex = this.serverWeekDays.findIndex(d => 
          this.isSameDay(d.date, this.customDragDay));
          
        const serverIndex = this.filteredServers.findIndex(s => 
          s.id === this.customDragCurrentServer.id);
          
        if (dayIndex >= 0 && serverIndex >= 0) {
          const dayContainers = document.querySelectorAll('.day-section');
          if (dayIndex < dayContainers.length) {
            const timelineContainer = dayContainers[dayIndex].querySelector('.timeline');
            
            if (timelineContainer) {
              const rect = timelineContainer.getBoundingClientRect();
              
              let relativeX = this.lastMouseX - rect.left;
              if (relativeX < 0) relativeX = 0;
              if (relativeX > rect.width) relativeX = rect.width;
              
              const fraction = relativeX / rect.width;
              let hours = 24 * fraction;
              hours = this.snapHoursTo00_15_30_45(hours);
              
              const newStart = new Date(this.customDragDay);
              newStart.setHours(Math.floor(hours), Math.round((hours - Math.floor(hours)) * 60), 0, 0);
              
              const os = new Date(this.customDragReservation.start);
              const oe = new Date(this.customDragReservation.end);
              const dur = oe - os;
              const newEnd = new Date(newStart.getTime() + dur);
              
              // Check for conflicts
              if (await this.checkConflictEfficient(
                this.customDragCurrentServer.name, 
                newStart, 
                newEnd, 
                this.customDragReservation.urgency,
                this.customDragReservation.id
              )) {
                alert('Conflict: overlapping on the same server, not all open to co-run.');
                this.customDragActive = false;
                this.customDragReservation = null;
                this.customDragStartServer = null;
                this.customDragCurrentServer = null;
                this.customDragDay = null;
                this.isDragging = false;
                this.customDragInitialRect = null;
                return;
              }
              
              const updatedTitle = `${this.customDragCurrentServer.name} (${this.customDragReservation.urgency})`;
              
              const updated = {
                ...this.customDragReservation,
                title: updatedTitle,
                server: this.customDragCurrentServer.name,
                start: this.toLocalOffsetISOString(newStart),
                end: this.toLocalOffsetISOString(newEnd)
              };
              
              const significantMove = dragDistance > this.dragThreshold * 4;
              if (significantMove) {
                this.updateReservationSilent(updated);
              } else {
                this.editingReservation = null;
                
                this.$nextTick(() => {
                  this.editingReservation = {
                    ...updated,
                    startDate: this.formatMmmDdYyyy(newStart),
                    startTime: this.formatHhMmAmPm(newStart),
                    endDate: this.formatMmmDdYyyy(newEnd),
                    endTime: this.formatHhMmAmPm(newEnd)
                  };
                  
                  this.showEditModal = true;
                });
              }
            }
          }
        }
      }
      
      this.customDragActive = false;
      this.customDragReservation = null;
      this.customDragStartServer = null;
      this.customDragCurrentServer = null;
      this.customDragDay = null;
      this.isDragging = false;
      this.customDragInitialRect = null;
    },

    
    // Format time range function
    formatTimeRange(start, end) {
      const startTime = start.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const endTime = end.toLocaleTimeString('en-US', {
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true
      });
      return `${startTime} - ${endTime}`;
    },

    // Check if reservation is mine
    isMyReservation(reservation) {
      return reservation.username === this.currentUsername;
    },

    // Add this new method to check if server has an attached device with a matching name
    serverHasAttachedDeviceMatchingFilter(server, filter) {
      // If no attached devices, return false
      if (!server.attachedDevices || !server.attachedDevices.length) {
        return false;
      }
      
      // Check each attached device for a name match
      return server.attachedDevices.some(deviceId => {
        // Find the device object with this ID
        const device = this.devicesList.find(d => d.id === deviceId);
        
        // If device found and has a name, check if it contains the filter string
        return device && device.name && device.name.toLowerCase().includes(filter);
      });
    },
    
    // Load devices data for filtering with daily caching
    async loadDevices() {
      try {
        this.devicesList = await dailyCache.loadData('devices');
        console.log('Loaded devices:', this.devicesList.length);
        return this.devicesList;
      } catch (error) {
        console.error('Error loading devices:', error);
        this.devicesList = [];
        return [];
      }
    },
    
    // Determine color class based on urgency
    getUrgencyColorClass(urgency) {
      if (!urgency) return 'urgency-default';
      
      const lowerUrgency = urgency.toLowerCase();
      
      if (lowerUrgency.includes('co-run')) {
        return 'urgency-corun';
      } else if (lowerUrgency.includes('may yield')) {
        return 'urgency-exclusive-light';
      } else if (lowerUrgency.includes('urgent')) {
        return 'urgency-exclusive-dark';
      } else {
        return 'urgency-exclusive-medium';
      }
    },
    // Reset filters - simplified to use only unifiedFilter
    clearAllFilters() {
      this.unifiedFilter = '';
      this.serverFilter = ''; // For backward compatibility
      this.deviceFilter = ''; // For backward compatibility
      this.showOnlyFavorites = false;
      
      // Update URL to remove filter parameters
      if (this.$route.query.server || this.$route.query.device) {
        this.$router.replace({ path: this.$route.path });
      }
    },

    // Format IP address for display
    formatIp(ip) {
      if (!ip) return 'N/A';
      return Array.isArray(ip) ? ip.join(', ') : ip;
    },
    
    // Format status text
    formatStatus(status) {
      if (!status) return 'Unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
    
    // Get status color class
    getStatusColor(status) {
      if (!status) return 'status-red';
      return status.toLowerCase() === 'on' ? 'status-green' : 'status-red';
    },
    
    // Format field name for display (convert camelCase to Title Case)
    formatFieldName(key) {
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase());
    },

    // Parse BMC IPs (handles comma-separated IPs)
    parseBmcIps(bmcIp) {
      if (!bmcIp) return [];
      // Split by comma and trim whitespace
      return bmcIp.split(',').map(ip => ip.trim()).filter(ip => ip.length > 0);
    },

    // Password visibility methods
    isPasswordVisible(type) {
      return this.visiblePasswords.has(type);
    },

    togglePasswordVisibility(type) {
      if (this.visiblePasswords.has(type)) {
        this.visiblePasswords.delete(type);
      } else {
        this.visiblePasswords.add(type);
        // Auto-hide password after 5 seconds
        setTimeout(() => {
          this.visiblePasswords.delete(type);
          this.$forceUpdate();
        }, 5000);
      }
    },

    // Check if user has view permissions
    hasViewPermissions() {
      return isAdmin() || isUser();
    },
    
    // Show server details modal
    showServerDetails(server) {
      this.activeServer = server;
      
      // Get attached devices
      this.serverAttachedDevices = [];
      if (server.attachedDevices && server.attachedDevices.length) {
        this.serverAttachedDevices = server.attachedDevices.map(deviceId => {
          const device = this.devicesList.find(d => d.id === deviceId);
          return device || { id: deviceId, name: 'Unknown Device' };
        });
      }
      
      this.showServerDetailsModal = true;
    },
    
    // Close server details modal
    closeServerDetails() {
      this.showServerDetailsModal = false;
      this.activeServer = null;
      this.serverAttachedDevices = [];
      this.visiblePasswords.clear(); // Clear visible passwords when closing modal
    },
    
    // Reserve the active server
    reserveActiveServer() {
      if (this.activeServer) {
        this.$router.push({
          path: '/calendar',
          query: { server: this.activeServer.name }
        });
        this.unifiedFilter = this.activeServer.name;
        this.closeServerDetails();
      }
    },
    
    // Filter server properties to get "additional" fields
    getAdditionalFields(server) {
      if (!server) return {};

      const basicFields = [
        'id', 'name', 'cpuType', 'ip', 'owner', 'sudoUser', 'sudoUserPassword',
        'status', 'location', 'attachedDevices', 'cpuFreq', 'memorySlots',
        'dimmType', 'numDimms', 'bmcIp', 'bmcUser', 'bmcPassword', 'ubuntuVersion'
      ];

      return Object.fromEntries(
        Object.entries(server).filter(([key, value]) =>
          !basicFields.includes(key) &&
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !key.toLowerCase().includes('transfer')
        )
      );
    },
    // Helper function to determine CPU type group priority
    getCpuTypeGroupIndex(cpuType) {
      if (!cpuType) return 999; // Default/unknown goes last
      
      const cpuLower = cpuType.toLowerCase();
      
      // Green group - highest priority (0)
      if (cpuLower.includes('spr') || cpuLower.includes('emr') || cpuLower.includes('gnr')) {
        return 0;
      }
      
      // Blue group - second priority (1)
      if (cpuLower.includes('skx') || cpuLower.includes('icx') || cpuLower.includes('skl')) {
        return 1;
      }
      
      // Purple group - third priority (2)
      if (cpuLower.includes('epyc')) {
        return 2;
      }
      
      // Orange group - fourth priority (3)
      if (cpuLower.includes('hsw') || cpuLower.includes('bdw') || 
          cpuLower.includes('haswell') || cpuLower.includes('broadwell')) {
        return 3;
      }
      
      // Default case - lowest priority
      return 4;
    },
    // Check if a server is in the favorites list
    isServerFavorite(serverId) {
      return this.favoriteServers.has(serverId);
    },
    
    // Load favorites from Firestore
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
    
  },
  watch: {
    startDateInput() {
      this.startTimeChoices;
      this.endTimeChoices;
    },
    startTimeInput() {
      this.startTimeChoices;
      this.endTimeChoices;
    },
    endDateInput() {
      this.startTimeChoices;
      this.endTimeChoices;
    },
    endTimeInput() {
      this.startTimeChoices;
      this.endTimeChoices;
    },
    'editingReservation.startDate'() {
      if (this.editingReservation) this.validateEditTimes();
    },
    'editingReservation.startTime'() {
      if (this.editingReservation) this.validateEditTimes();
    },
    'editingReservation.endDate'() {
      if (this.editingReservation) this.validateEditTimes();
    },
    'editingReservation.endTime'() {
      if (this.editingReservation) this.validateEditTimes();
    },
    showEditModal(val) {
      if (val && this.editingReservation) {
        this.$nextTick(() => {
          this.validateEditTimes();
        });
      }
    },
    // Updated watcher to handle both server and device filters from URL and
    // apply them to the unified filter
    '$route.query'(newQuery) {
      if (newQuery.server) {
        this.unifiedFilter = newQuery.server;
        this.selectedViewType = 'server'; 
      } else if (newQuery.device) {
        this.unifiedFilter = newQuery.device;
      }
    }
  },
  mounted(){
    // Clean up old cache entries on app startup
    dailyCache.cleanupOldCache()
    
    // Load favorites if user is already authenticated
    if (this.currentUserEmail) {
      this.loadFavorites();
    }
  },
  created(){
    this.weekStart=new Date()
    this.loadServers()
    this.loadReservations()
    this.loadDevices().then(() => {
      // Check for server or device filter in URL query parameters
      const serverName = this.$route.query.server;
      const deviceName = this.$route.query.device;
      
      if (serverName) {
        this.unifiedFilter = serverName;
      } else if (deviceName) {
        this.unifiedFilter = deviceName;
      }
    });
    
    
    // Load favorites when user is authenticated
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.userRole = await getUserRole();
        this.loadFavorites(); // Load favorites when authenticated
      } else {
        this.userRole = 'guest';
        this.favoriteServers = new Set(); // Clear favorites when logged out
      }
    });
  },
  beforeUnmount() {
    if (this.customDragActive) {
      window.removeEventListener('mousemove', this.handleCustomDragMove);
      window.removeEventListener('mouseup', this.handleCustomDragEnd);
      if (this.dragAnimationFrame) {
        cancelAnimationFrame(this.dragAnimationFrame);
      }
    }
    
    // Clean up Firebase listeners to prevent memory leaks
    if (this.unsubscribeReservations) {
      this.unsubscribeReservations();
    }
  }
}
</script>
 

