<template>
  <div class="home-container">
    <!-- Add logout button in the top right corner -->
    <div class="logout-container">
      <button v-if="currentUser" class="logout-button" @click="handleLogout">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <span>Logout</span>
      </button>
    </div>
    
    <div class="home-header">
      <h1>Server Reservation System</h1>
      <p v-if="currentUsername" class="welcome-message">Welcome, <span class="username">{{ currentUsername }}</span></p>
    </div>
    
    <div class="nav-cards">
      <div class="nav-card" @click="navigateTo('/servers')">
        <div class="icon-container server-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div class="card-content">
          <h2>Server List</h2>
          <p>Browse and manage available servers</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
      
      <div class="nav-card" @click="navigateTo('/devices')">
        <div class="icon-container device-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <circle cx="9" cy="9" r="2"></circle>
            <path d="M15 9h.01"></path>
            <path d="M15 15h.01"></path>
            <path d="M9 15h.01"></path>
          </svg>
        </div>
        <div class="card-content">
          <h2>Device List</h2>
          <p>Manage hardware devices and components</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
      
      <div class="nav-card" @click="navigateTo('/calendar')">
        <div class="icon-container calendar-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="card-content">
          <h2>Reservation Calendar</h2>
          <p>Schedule and manage server reservations</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
      
      <div class="nav-card" @click="navigateTo('/notices')">
        <div class="icon-container notice-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
          </svg>
        </div>
        <div class="card-content">
          <h2>Notices</h2>
          <p>View important announcements and updates</p>
        </div>
        <div class="card-arrow">→</div>
      </div>
    </div>
    
    <!-- Updated quick stats section with personalized information -->
    <div class="quick-stats">
      <!-- My Servers panel -->
      <div class="info-panel">
        <div class="info-header">
          <h3>My Servers</h3>
          <div class="panel-actions">
            <div class="app-toggle-buttons-small">
              <button 
                :class="{ active: serverViewMode === 'owned' }" 
                @click="serverViewMode = 'owned'"
              >
                Own
              </button>
              <button 
                :class="{ active: serverViewMode === 'favorite' }" 
                @click="serverViewMode = 'favorite'"
              >
                Favorite
              </button>
            </div>
            <button class="view-all-btn" @click="navigateToServers">View All</button>
          </div>
        </div>
        <div class="info-content">
          <div v-if="displayedServers.length === 0" class="empty-state">
            {{ serverViewMode === 'owned' ? "You don't own any servers yet" : "You don't have any favorite servers yet" }}
          </div>
          <div v-else class="item-list">
            <div v-for="server in displayedServers.slice(0, 3)" :key="server.id" class="info-item" @click="navigateTo(`/servers?filter=${server.name}`)">
              <div class="item-name">{{ server.name }}</div>
              <div class="item-details">
                <span class="item-type">{{ server.cpuType }}</span>
                <span class="item-status" :class="getStatusClass(server.status)">{{ formatStatus(server.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- My Devices panel -->
      <div class="info-panel">
        <div class="info-header">
          <h3>My Devices</h3>
          <div class="panel-actions">
            <div class="app-toggle-buttons-small">
              <button 
                :class="{ active: deviceViewMode === 'owned' }" 
                @click="deviceViewMode = 'owned'"
              >
                Owned
              </button>
              <button 
                :class="{ active: deviceViewMode === 'used' }" 
                @click="deviceViewMode = 'used'"
              >
                Used
              </button>
            </div>
            <button class="view-all-btn" @click="viewAllDevices">View All</button>
          </div>
        </div>
        <div class="info-content">
          <div v-if="myDevices.length === 0" class="empty-state">
            You don't {{ deviceViewMode === 'owned' ? 'own' : 'use' }} any devices yet
          </div>
          <div v-else class="item-list">
            <div v-for="device in myDevices.slice(0, 3)" :key="device.id" class="info-item" @click="navigateTo(`/devices?filter=${device.name}`)">
              <div class="item-name">{{ device.name }}</div>
              <div class="item-details">
                <span class="item-type">{{ device.type || 'Unknown' }}</span>
                <span class="item-status" :class="device.attachedServer ? 'status-used' : 'status-available'">
                  {{ device.attachedServer ? 'In use' : 'Available' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Admin panel -->
      <div class="info-panel admin-panel">
        <div class="info-header">
          <h3>Admin</h3>
          <button class="view-all-btn" @click="navigateTo('/admin')">Access</button>
        </div>
        <div class="info-content">
          <div class="admin-features">
            <router-link to="/admin/members" class="admin-feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div class="feature-text">Manage Group Members</div>
            </router-link>
            <router-link to="/admin/ownership" class="admin-feature-item">
              <div class="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
              </div>
              <div class="feature-text">Transfer Ownership</div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <!-- My Recent Reservations section with enhanced styling -->
    <div class="recent-section">
      <div class="info-header">
        <h2>My Recent Reservations</h2>
        <button class="view-all-btn" @click="navigateTo('/calendar')">View All</button>
      </div>
      <div class="recent-list">
        <div v-if="recentReservations.length > 0">
          <div 
            v-for="(res, index) in recentReservations" 
            :key="index" 
            class="recent-item" 
            @click="navigateTo(`/calendar?server=${encodeURIComponent(res.server)}`)"
          >
            <div class="reservation-dot" :class="getUrgencyColorClass(res.urgency)"></div>
            <div class="recent-content">
              <div class="recent-title">{{ res.server }}</div>
              <div class="recent-time">{{ formatReservationTime(res) }}</div>
            </div>
            <div class="recent-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          You don't have any recent reservations
        </div>
      </div>
    </div>
    
    <!-- Updated footer with centered alignment and Bug Report link -->
    <footer class="home-footer">
      <div class="footer-content">
        <p>Server Reservation System – v1.2</p>
        <p class="footer-links">
          <a href="/ServerReservation/manual.pdf" @click.prevent="openManual">Help</a> · 
          <a href="#" @click.prevent="reportBug">Bug Report</a>
        </p>
      </div>
    </footer>
    
    <!-- 버그 리포트 모달 - 공통 모달 스타일 사용하여 현재 페이지 위에 표시 -->
    <div v-if="showBugReportModal" class="app-modal-overlay" @click.self="closeBugReportModal">
      <div class="app-modal bug-report-modal">
        <div class="app-modal-header">
          <h3>Report a Bug</h3>
        </div>
        <div class="app-modal-content">
          <div class="app-form-group">
            <label for="bugTitle">Title <span class="app-required-field">*</span></label>
            <input type="text" id="bugTitle" v-model="bugReport.title" placeholder="Brief title for the issue">
          </div>
          
          <!-- 새로 추가한 페이지 선택 필드 -->
          <div class="app-form-group">
            <label for="bugPage">Page <span class="app-required-field">*</span></label>
            <select id="bugPage" v-model="bugReport.page">
              <option value="" disabled selected>Select the page with the issue</option>
              <option value="Server List">Server List</option>
              <option value="Device List">Device List</option>
              <option value="Calendar">Calendar</option>
              <option value="Notice">Notice</option>
              <option value="Homepage">Homepage</option>
            </select>
          </div>
          
          <div class="app-form-group">
            <label for="bugPriority">Priority</label>
            <select id="bugPriority" v-model="bugReport.priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="app-form-group">
            <label for="bugDescription">Description <span class="app-required-field">*</span></label>
            <textarea 
              id="bugDescription" 
              v-model="bugReport.description" 
              placeholder="Please describe the issue in detail" 
              rows="4"
            ></textarea>
          </div>
        </div>
        <div class="app-modal-footer">
          <button @click="submitBugReport" class="app-btn app-btn-primary">Submit Bug</button>
          <button @click="closeBugReportModal" class="app-btn app-btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
    
    <!-- PDF Manual Viewer Modal - simplified version -->
    <div v-if="showManualModal" class="app-modal-overlay" @click.self="closeManual">
      <div class="app-modal manual-modal">
        <div class="app-modal-header">
          <h3>User Manual</h3>
          <button class="close-button" @click="closeManual">&times;</button>
        </div>
        <div class="app-modal-content pdf-container">
          <iframe
            :src="manualPdfUrl"
            width="100%"
            height="100%"
            class="pdf-frame"
            title="User Manual"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { firestore, auth } from '@/firebase'
import { collection, onSnapshot, query, where, orderBy, addDoc, getDocs } from 'firebase/firestore'
import { dailyCache } from '@/utils/dailyCache'
import '@/assets/styles/common/modal-common.css'
import '@/assets/styles/common/common-ui.css'
import '@/assets/styles/common/icon-styles.css'
import '@/assets/styles/components/HomePage.css'
export default {
  name: 'HomePage',
  data() {
    return {
      servers: [],
      devices: [],
      reservations: [],
      recentReservations: [],
      currentUser: null,
      deviceViewMode: 'owned',
      showBugReportModal: false,
      bugReport: {
        title: '',
        description: '',
        priority: 'medium',
        page: '',
        submitted: false,
        completed: false,
        submittedBy: '',
        submittedAt: null
      },
      serverViewMode: 'owned',
      favoriteServers: new Set(), // Initialize favoriteServers as a Set
      userDocId: null, // Add user document ID for updating favorites
      showManualModal: false,
      manualPdfUrl: '/ServerReservation/manual.pdf'
    }
  },
  computed: {
    currentUsername() {
      return this.currentUser ? this.currentUser.email.split('@')[0] : ''
    },
    
    // Filter servers owned by current user
    myServers() {
      if (!this.currentUsername) return []
      return this.servers.filter(server => 
        server.owner && server.owner.toLowerCase() === this.currentUsername.toLowerCase()
      )
    },
    
    // Filter devices owned by current user
    myDevices() {
      if (!this.currentUsername) return []
      
      if (this.deviceViewMode === 'owned') {
        return this.devices.filter(device => 
          device.owner && device.owner.toLowerCase() === this.currentUsername.toLowerCase()
        )
      } else { // 'used' mode
        // Update this to look at the users array instead of usedBy field
        return this.devices.filter(device => 
          device.users && Array.isArray(device.users) && 
          device.users.some(user => user.toLowerCase() === this.currentUsername.toLowerCase())
        )
      }
    },
    
    // Add computed property for displayed servers based on view mode
    displayedServers() {
      if (this.serverViewMode === 'owned') {
        return this.myServers;
      } else {
        // Return favorite servers from the servers list
        return this.servers.filter(server => 
          this.favoriteServers && this.favoriteServers.has(server.id)
        );
      }
    },
  },
  methods: {
    // Load data once instead of real-time listeners to reduce Firebase requests
    async loadStaticData() {
      try {
        // Load servers using daily cache
        this.servers = await dailyCache.loadData('servers');
        
        // Load devices using daily cache  
        this.devices = await dailyCache.loadData('devices');
        
        // Reservations should remain real-time for user's personal data
        const reservationsSnap = await getDocs(collection(firestore, 'reservations'));
        this.reservations = reservationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log('Loaded static data from cache: servers:', this.servers.length, 'devices:', this.devices.length, 'reservations:', this.reservations.length);
      } catch (error) {
        console.error('Error loading static data:', error);
      }
    },
    navigateTo(route, query = {}) {
      this.$router.push({ path: route, query })
    },
    navigateToServers() {
      this.navigateTo('/servers', { ownershipFilter: this.serverViewMode })
    },
    showHelp() {
      alert('Help documentation will be available soon.')
    },
    showAbout() {
      alert('Server Reservation System v1.0\nDeveloped for managing server resources.')
    },
    getUrgencyColorClass(urgency) {
      if (!urgency) return 'urgency-default'
      
      const lowerUrgency = urgency.toLowerCase()
      
      if (lowerUrgency.includes('co-run')) {
        return 'urgency-corun'
      } else if (lowerUrgency.includes('may yield')) {
        return 'urgency-exclusive-light'
      } else if (lowerUrgency.includes('urgent')) {
        return 'urgency-exclusive-dark'
      } else {
        return 'urgency-exclusive-medium'
      }
    },
    formatReservationTime(reservation) {
      if (!reservation.start || !reservation.end) return ''
      
      const start = new Date(reservation.start)
      const end = new Date(reservation.end)
      
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      }
      
      const formatDate = (date) => {
        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }
      
      return `${formatDate(start)}, ${formatTime(start)} - ${formatTime(end)}`
    },
    getStatusClass(status) {
      if (!status) return 'status-unknown'
      return status.toLowerCase() === 'on' ? 'status-online' : 'status-offline'
    },
    formatStatus(status) {
      if (!status) return 'Unknown'
      return status.charAt(0).toUpperCase() + status.slice(1)
    },
    loadData() {
      // Auth state listener
      auth.onAuthStateChanged(user => {
        this.currentUser = user
        if (user) {
          this.loadRecentReservations()
          this.loadFavorites() // Add this call to load favorites when user logs in
        } else {
          this.favoriteServers = new Set(); // Clear favorites when logged out
        }
      })
      
      // Load data once instead of real-time to reduce Firebase load
      this.loadStaticData()
    },
    // Updated to show only most recent reservation per server
    loadRecentReservations() {
      if (!this.currentUser) return
      
      const username = this.currentUser.email.split('@')[0]
      const reservationsRef = collection(firestore, 'reservations')
      const userReservationsQuery = query(
        reservationsRef,
        where('username', '==', username),
        orderBy('start', 'desc')
      )
      
      onSnapshot(userReservationsQuery, (snapshot) => {
        const allReservations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        
        // Group by server and keep only the most recent for each
        const serverMap = new Map()
        
        allReservations.forEach(reservation => {
          const serverName = reservation.server
          
          if (!serverMap.has(serverName) || 
              new Date(reservation.start) > new Date(serverMap.get(serverName).start)) {
            serverMap.set(serverName, reservation)
          }
        })
        
        // Convert map back to array and take only the first 3
        this.recentReservations = Array.from(serverMap.values()).slice(0, 3)
      })
    },
    // New bug report method
    reportBug() {
      // Path detection to pre-select the current page
      const currentPath = this.$route.path;
      let currentPage = 'Homepage';
      
      if (currentPath.includes('/servers')) {
        currentPage = 'Server List';
      } else if (currentPath.includes('/devices')) {
        currentPage = 'Device List';
      } else if (currentPath.includes('/calendar')) {
        currentPage = 'Calendar';
      } else if (currentPath.includes('/notices')) {
        currentPage = 'Notice';
      }
      
      // Reset to initial values
      this.bugReport = {
        title: '',
        description: '',
        priority: 'medium',
        page: currentPage,
        submitted: false,
        completed: false,
        submittedBy: this.currentUsername,
        submittedAt: null
      }
      this.showBugReportModal = true
      console.log('Bug report modal opened:', this.showBugReportModal)
    },
    
    closeBugReportModal() {
      this.showBugReportModal = false
    },
    
    async submitBugReport() {
      if (!this.bugReport.title.trim()) {
        alert('Please enter a title for the bug report')
        return
      }
      
      if (!this.bugReport.page) {
        alert('Please select the page where you encountered the issue')
        return
      }
      
      if (!this.bugReport.description.trim()) {
        alert('Please provide a description of the issue')
        return
      }
      
      try {
        const bugsCollection = collection(firestore, 'bugs')
        const bugData = {
          ...this.bugReport,
          submittedAt: new Date().toISOString(),
          submittedBy: this.currentUsername || 'Anonymous',
          submitted: true
        }
        
        await addDoc(bugsCollection, bugData)
        alert('Bug report submitted successfully!')
        this.closeBugReportModal()
      } catch (error) {
        console.error('Error submitting bug report:', error)
        alert('Failed to submit bug report: ' + error.message)
      }
    },
    viewAllDevices() {
      this.navigateTo('/devices', { 
        mode: this.deviceViewMode,
        ownershipFilter: this.deviceViewMode
      })
    },
    // Add logout method
    async handleLogout() {
      try {
        await auth.signOut();
        console.log('User logged out successfully');
        this.$router.push('/'); // Redirect to login page
      } catch (error) {
        console.error('Error logging out:', error);
      }
    },
    // Load favorites from Firestore (if not already defined)
    async loadFavorites() {
      if (!this.currentUser || !this.currentUser.email) return;
      
      try {
        const usersRef = collection(firestore, 'authorizedUsers');
        const q = query(usersRef, where("email", "==", this.currentUser.email));
        
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
    openManual() {
      this.showManualModal = true
    },
    closeManual() {
      this.showManualModal = false
    },
  },
  created() {
    this.loadData()
    
    // Load favorites if user is already authenticated
    if (auth.currentUser) {
      this.loadFavorites();
    }
  }
}
</script>

