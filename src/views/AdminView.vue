<template>
  <div class="admin-container">
    <!-- Home icon button -->
    <router-link to="/home" class="home-icon-button" title="Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </router-link>

    <h2>Admin Panel</h2>
    
    <!-- Updated Tabs for admin features with router-link -->
    <div class="admin-tabs">
      <router-link to="/admin/members" custom v-slot="{ navigate, isActive }">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'members' || isActive }"
          @click="navigate"
        >
          Group Members
        </button>
      </router-link>
      <router-link to="/admin/ownership" custom v-slot="{ navigate, isActive }">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'ownership' || isActive }"
          @click="navigate"
        >
          Ownership Transfer
        </button>
      </router-link>
      <button 
        class="tab-button" 
        :class="{ active: activeTab === 'system' }"
        @click="activeTab = 'system'"
      >
        System
      </button>
    </div>
    
    <!-- Group Members Management -->
    <div v-if="activeTab === 'members'" class="admin-section">
      <div class="section-header">
        <h3>Group Members Management</h3>
      </div>
      
      <!-- Invite new member form - updated with user type selection -->
      <div class="admin-panel">
        <h4>Invite New Member</h4>
        <div class="form-group">
          <label for="inviteEmail">Email Address:</label>
          <div class="input-with-button">
            <input 
              type="email" 
              id="inviteEmail" 
              v-model="inviteEmail" 
              placeholder="user@illinois.edu"
            />
            <button 
              @click="inviteUser" 
              class="action-button"
              :disabled="!isValidEmail || isInviting"
            >
              {{ isInviting ? 'Adding...' : 'Add User' }}
            </button>
          </div>
        </div>
        
        <!-- New user type selection with disabled options -->
        <div class="form-group">
          <label for="userType">User Type:</label>
          <select id="userType" v-model="newUserType" class="user-type-select">
            <option value="normal" :disabled="!canAssignRole('normal')">Normal User</option>
            <option value="admin" :disabled="!canAssignRole('admin')">Admin</option>
            <option value="guest" :disabled="!canAssignRole('guest')">Guest</option>
          </select>
          <p class="help-text">
            <strong>Admin:</strong> Can manage members and has full system access.<br>
            <strong>Normal:</strong> Regular user with standard permissions.<br>
            <strong>Guest:</strong> Limited access user.
          </p>
        </div>
      </div>
      
      <!-- Manage existing members - updated with user type management -->
      <div class="admin-panel">
        <h4>Manage Members</h4>
        <div v-if="isLoading" class="loading">
          Loading members...
        </div>
        <div v-else>
          <div v-if="members.length === 0" class="empty-state">
            No members found.
          </div>
          <div v-else class="members-list">
            <div v-for="member in sortedMembers" :key="member.email" class="member-item">
              <div class="member-info">
                <div class="member-name">
                  {{ member.name || member.email }}
                  <span 
                    class="user-type-badge"
                    :class="{
                      'admin-badge': member.userType === 'admin',
                      'normal-badge': member.userType === 'normal',
                      'guest-badge': member.userType === 'guest'
                    }"
                  >
                    {{ formatUserType(member.userType) }}
                  </span>
                </div>
                <div class="member-email">{{ member.email }}</div>
              </div>
              <div class="member-actions">
                <!-- Show user type options only if current member is not admin -->
                <div v-if= "currentUserIsAdmin && member.email !== currentUserEmail" class="user-type-action">
                  <select 
                    v-model="member.userType" 
                    @change="changeUserType(member)"
                    class="type-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="normal">Normal</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <!-- Show Remove button only if member is not admin and not current user -->
                <button 
                  v-if="member.userType !== 'admin' && currentUserIsAdmin"
                  @click="confirmRemoveMember(member)"
                  class="remove-button"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Ownership Transfer -->
    <div v-if="activeTab === 'ownership'" class="admin-section">
      <div class="section-header">
        <h3>Ownership Transfer</h3>
      </div>
      
      <!-- My Servers -->
      <div class="admin-panel">
        <h4>My Servers</h4>
        <div v-if="isLoadingServers" class="loading">
          Loading servers...
        </div>
        <div v-else>
          <div v-if="myServers.length === 0" class="empty-state">
            You don't own any servers.
          </div>
          <div v-else class="items-list">
            <div v-for="server in myServers" :key="server.id" class="item">
              <div class="item-info">
                <div class="item-name">{{ server.name }}</div>
                <div class="item-type">{{ server.cpuType }}</div>
              </div>
              <div class="item-actions">
                <button 
                  @click="showTransferModal('server', server)"
                  class="transfer-button"
                >
                  Transfer Ownership
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- My Devices -->
      <div class="admin-panel">
        <h4>My Devices</h4>
        <div v-if="isLoadingDevices" class="loading">
          Loading devices...
        </div>
        <div v-else>
          <div v-if="myDevices.length === 0" class="empty-state">
            You don't own any devices.
          </div>
          <div v-else class="items-list">
            <div v-for="device in myDevices" :key="device.id" class="item">
              <div class="item-info">
                <div class="item-name">{{ device.name }}</div>
                <div class="item-type">{{ device.type }}</div>
              </div>
              <div class="item-actions">
                <button 
                  @click="showTransferModal('device', device)"
                  class="transfer-button"
                >
                  Transfer Ownership
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- System Management -->
    <div v-if="activeTab === 'system'" class="admin-section">
      <div class="section-header">
        <h3>System Management</h3>
      </div>
      
      <!-- Cache Management -->
      <div class="admin-panel">
        <h4>Cache Management</h4>
        <p>Clear all cached data to force fresh data loading from the server. This includes both local storage and service worker caches.</p>
        <CacheManager />
      </div>
      
      <!-- Delta Updates Management -->
      <div class="admin-panel">
        <h4>Delta Updates</h4>
        <p>Manage incremental updates for cached data. Delta updates check for changes every 5 minutes to keep data fresh while minimizing Firebase usage.</p>
        <DeltaUpdatesManager />
      </div>
      
      <!-- System Information -->
      <div class="admin-panel">
        <h4>System Information</h4>
        <div class="system-info">
          <div class="info-item">
            <span class="info-label">Environment:</span>
            <span class="info-value">{{ systemInfo.environment }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Build Version:</span>
            <span class="info-value">{{ systemInfo.version }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Service Worker:</span>
            <span class="info-value">{{ systemInfo.serviceWorker }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Transfer Ownership Modal -->
    <div v-if="showTransfer" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h4>Transfer Ownership</h4>
        </div>
        <div class="modal-content">
          <p>
            You are transferring ownership of <strong>{{ transferItem.name }}</strong> 
            ({{ transferItemType === 'server' ? 'Server' : 'Device' }}).
          </p>
          <div class="form-group">
            <label for="newOwner">New Owner:</label>
            <select id="newOwner" v-model="newOwner" required>
              <option value="" disabled>Select a member</option>
              <option 
                v-for="member in memberOptions" 
                :key="member.email" 
                :value="member.email"
              >
                {{ member.name || member.email }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="transferComment">Comment (optional):</label>
            <textarea 
              id="transferComment" 
              v-model="transferComment"
              placeholder="Add a note about this transfer"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="confirmTransfer" class="confirm-button" :disabled="!newOwner">
            Transfer Ownership
          </button>
          <button @click="cancelTransfer" class="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { auth, firestore } from '@/firebase'
import { collection, query, where, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore'
import { dailyCache } from '@/utils/dailyCache'
import CacheManager from '@/components/CacheManager.vue'
import DeltaUpdatesManager from '@/components/DeltaUpdatesManager.vue'

export default {
  name: 'AdminView',
  components: {
    CacheManager,
    DeltaUpdatesManager
  },
  props: {
    defaultTab: String
  },
  data() {
    return {
      activeTab: 'members',
      members: [],
      myServers: [],
      myDevices: [],
      isLoading: true,
      isLoadingServers: true,
      isLoadingDevices: true,
      inviteEmail: '',
      isInviting: false,
      showTransfer: false,
      transferItemType: null,
      transferItem: null,
      newOwner: '',
      transferComment: '',
      isTransferring: false,
      newUserType: 'normal' // default for new users
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
    currentUser() {
      return this.members.find(member => member.email === this.currentUserEmail) || null;
    },
    // Always calculate latest admin status
    currentUserIsAdmin() {
      if (this.currentUserEmail === 'hnpark2@illinois.edu') return true;
      return this.currentUser ? this.currentUser.userType === 'admin' : false;
    },
    isValidEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(this.inviteEmail) && this.inviteEmail !== this.currentUserEmail;
    },
    memberOptions() {
      return this.members.filter(member => member.email !== this.currentUserEmail);
    },
    // Sort members to show admins at the top
    sortedMembers() {
      return [...this.members].sort((a, b) => {
        // First, sort by user type (admins first, then normal, then guest)
        const typeOrder = { admin: 1, normal: 2, guest: 3 };
        const typeA = typeOrder[a.userType] || 2; // Default to normal if undefined
        const typeB = typeOrder[b.userType] || 2; // Default to normal if undefined
        
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        
        // Then sort by name/email
        const nameA = a.name || a.email || '';
        const nameB = b.name || b.email || '';
        return nameA.localeCompare(nameB);
      });
    },
    // Get current user's role level
    currentUserRoleLevel() {
      const roleLevels = {
        'admin': 3,
        'normal': 2,
        'guest': 1
      };

      if (this.currentUserEmail === 'hnpark2@illinois.edu') {
        return roleLevels.admin; // Default admin has top level
      }
      
      const currentUser = this.members.find(m => m.email === this.currentUserEmail);
      return currentUser && currentUser.userType ? roleLevels[currentUser.userType] || roleLevels.normal : roleLevels.normal;
    },
    
    // System information for admin panel
    systemInfo() {
      return {
        environment: process.env.NODE_ENV,
        version: process.env.VUE_APP_VERSION || '1.0.0',
        serviceWorker: ('serviceWorker' in navigator) ? 'Available' : 'Not Available'
      }
    }
  },
  
  methods: {
    async inviteUser() {
      if (!this.isValidEmail || this.isInviting) return;
      
      // Prevent guests from inviting users
      if (this.currentUserRoleLevel <= 1) { // Guest level is 1
        alert('Guest users cannot invite new members.');
        return;
      }
      
      this.isInviting = true;
      
      try {
        // Check if user is already a member
        const isExistingMember = this.members.some(member => 
          member.email.toLowerCase() === this.inviteEmail.toLowerCase()
        );
        
        if (isExistingMember) {
          alert('This user is already a member.');
          this.isInviting = false;
          return;
        }
        
        // Check if user can assign this role type
        if (!this.canAssignRole(this.newUserType)) {
          alert(`You don't have permission to create a user with ${this.formatUserType(this.newUserType)} privileges.`);
          this.isInviting = false;
          return;
        }
        
        // Add to authorizedUsers collection with user type
        await addDoc(collection(firestore, 'authorizedUsers'), {
          email: this.inviteEmail,
          addedBy: this.currentUserEmail,
          addedDate: new Date().toISOString(),
          userType: this.newUserType // Add user type
        });
        
        // Refresh cache to show changes immediately
        await this.refreshMemberCache();
        
        // Show invitation message instead of sending email
        const invitationLink = "https://skyp0714.github.io/ServerReservation/";
        alert(`User ${this.inviteEmail} added. Share this link with them: ${invitationLink}`);
        
        this.inviteEmail = '';
        this.newUserType = 'normal'; // Reset to default
      } catch (error) {
        console.error('Error inviting user:', error);
        alert('Failed to add user. Please try again.');
      } finally {
        this.isInviting = false;
      }
    },
    
    confirmRemoveMember(member) {
      if (confirm(`Are you sure you want to remove ${member.email} from the system?`)) {
        this.removeMember(member);
      }
    },
    
    async removeMember(member) {
      try {
        // Get the document ID for this member
        const usersRef = collection(firestore, 'authorizedUsers');
        const q = query(usersRef, where("email", "==", member.email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          alert('User not found.');
          return;
        }
        
        // Delete the document
        await deleteDoc(doc(firestore, 'authorizedUsers', querySnapshot.docs[0].id));
        
        // Refresh cache to show changes immediately
        await this.refreshMemberCache();
        
        alert(`${member.email} has been removed from the system.`);
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member. Please try again.');
      }
    },
    
    showTransferModal(type, item) {
      this.transferItemType = type;
      this.transferItem = item;
      this.newOwner = '';
      this.transferComment = '';
      this.showTransfer = true;
    },
    
    cancelTransfer() {
      this.showTransfer = false;
      this.transferItemType = null;
      this.transferItem = null;
    },
    
    async confirmTransfer() {
      if (!this.newOwner || this.isTransferring) return;
      
      this.isTransferring = true;
      
      try {
        if (this.transferItemType === 'server') {
          // Update server document
          const serverRef = doc(firestore, 'servers', this.transferItem.id);
          await updateDoc(serverRef, {
            owner: this.newOwner.split('@')[0],
            transferredBy: this.currentUserEmail,
            transferDate: new Date().toISOString(),
            transferComment: this.transferComment || ''
          });
        } else if (this.transferItemType === 'device') {
          // Update device document
          const deviceRef = doc(firestore, 'devices', this.transferItem.id);
          await updateDoc(deviceRef, {
            owner: this.newOwner.split('@')[0],
            transferredBy: this.currentUserEmail,
            transferDate: new Date().toISOString(),
            transferComment: this.transferComment || ''
          });
        }
        
        alert(`Ownership of ${this.transferItem.name} has been transferred to ${this.newOwner}.`);
        this.showTransfer = false;
      } catch (error) {
        console.error('Error transferring ownership:', error);
        alert('Failed to transfer ownership. Please try again.');
      } finally {
        this.isTransferring = false;
      }
    },
    
    // Format user type for display
    formatUserType(type) {
      const types = {
        'admin': 'Admin',
        'guest': 'Guest',
        'normal': 'Normal'
      };
      return types[type] || 'Normal';
    },
    
    // Change user type
    async changeUserType(member) {
      try {
        if (!member || !member.id) {
          console.error('Cannot update member: missing ID');
          return;
        }
        
        // Don't allow changing default admin
        if (member.email === 'hnpark2@illinois.edu') {
          alert('Cannot change the type for the default admin user.');
          return;
        }
        
        const userRef = doc(firestore, 'authorizedUsers', member.id);
        await updateDoc(userRef, {
          userType: member.userType,
          updatedBy: this.currentUserEmail,
          updatedDate: new Date().toISOString()
        });
        
        console.log(`User type updated for ${member.email} to ${member.userType}`);
        
        // Refresh cache to show changes immediately
        await this.refreshMemberCache();
      } catch (error) {
        console.error('Error updating user type:', error);
        alert('Failed to update user type. Please try again.');
      }
    },
    
    // Check if current user can assign a specific role
    canAssignRole(role) {
      const roleLevels = { 'admin': 3, 'normal': 2, 'guest': 1 };
      return roleLevels[role] <= this.currentUserRoleLevel;
    },

    async loadMembers() {
      try {
        // Use 'users' as cache key for authorizedUsers collection
        const users = await dailyCache.loadData('users', 'authorizedUsers');
        this.members = users.map(data => ({
          ...data,
          userType: data.userType || (data.isAdmin ? 'admin' : 'normal') // Convert legacy isAdmin to userType
        }));
        this.isLoading = false;
        console.log('Loaded members:', this.members.length);
      } catch (error) {
        console.error('Error loading members:', error);
        this.isLoading = false;
        this.members = [];
      }
    },
    
    async loadMyServers() {
      try {
        const allServers = await dailyCache.loadData('servers');
        this.myServers = allServers.filter(server => 
          server.owner === this.currentUsername
        );
        this.isLoadingServers = false;
        console.log('Loaded my servers:', this.myServers.length);
      } catch (error) {
        console.error('Error loading servers:', error);
        this.isLoadingServers = false;
        this.myServers = [];
      }
    },
    
    async loadMyDevices() {
      try {
        const allDevices = await dailyCache.loadData('devices');
        this.myDevices = allDevices.filter(device => 
          device.owner === this.currentUsername
        );
        this.isLoadingDevices = false;
        console.log('Loaded my devices:', this.myDevices.length);
      } catch (error) {
        console.error('Error loading devices:', error);
        this.isLoadingDevices = false;
        this.myDevices = [];
      }
    },
    
    async initAuthorizedUsers() {
      // Check if we have any users already
      const usersRef = collection(firestore, 'authorizedUsers');
      const querySnapshot = await getDocs(usersRef);
      
      // If not, add the default admin user
      if (querySnapshot.empty) {
        try {
          await addDoc(usersRef, {
            email: 'hnpark2@illinois.edu',
            name: 'Haneul Park',
            userType: 'admin',
            addedDate: new Date().toISOString()
          });
          console.log('Default admin user added');
        } catch (error) {
          console.error('Error adding default admin user:', error);
        }
      }
    },

    // Refresh member cache after changes
    async refreshMemberCache() {
      try {
        const users = await dailyCache.refreshData('users', 'authorizedUsers');
        this.members = users.map(data => ({
          ...data,
          userType: data.userType || (data.isAdmin ? 'admin' : 'normal') // Convert legacy isAdmin to userType
        }));
        console.log('Cache refreshed - Members:', this.members.length);
      } catch (error) {
        console.error('Error refreshing member cache:', error);
      }
    }
  },
  mounted() {
    // Initialize data
    this.initAuthorizedUsers().then(() => {
      this.loadMembers();
      this.loadMyServers();
      this.loadMyDevices();
    });
    
    // Set active tab from route path or props
    const path = this.$route.path;
    if (path.includes('/members')) {
      this.activeTab = 'members';
    } else if (path.includes('/ownership')) {
      this.activeTab = 'ownership';
    } else if (this.defaultTab) {
      this.activeTab = this.defaultTab;
    }
  },
  watch: {
    // Watch for route changes to update the active tab
    $route(to) {
      if (to.path.includes('/members')) {
        this.activeTab = 'members';
      } else if (to.path.includes('/ownership')) {
        this.activeTab = 'ownership';
      }
    }
  }
}
</script>

<style scoped>
/* Use the same styles as ServerList.vue for consistency */
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.admin-tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.tab-button {
  padding: 12px 24px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 25px;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.2s ease;
  color: #555;
}

.tab-button:hover {
  background-color: #e0e0e0;
}

.tab-button.active {
  background-color: #4a77d4;
  color: white;
  border-color: #4a77d4;
  font-weight: 500;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  font-size: 1.3rem;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.admin-panel {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-panel h4 {
  font-size: 1.1rem;
  margin-top: 0;
  margin-bottom: 16px;
  color: #444;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 15px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.input-with-button {
  display: flex;
  gap: 10px;
}

.input-with-button input {
  flex: 1;
}

.help-text {
  margin-top: 6px;
  font-size: 13px;
  color: #777;
}

.action-button {
  background-color: #4a77d4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.action-button:hover {
  background-color: #3a67c4;
}

.action-button:disabled {
  background-color: #a0b4db;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #777;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #777;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.members-list, .items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.member-item, .item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.member-item:hover, .item:hover {
  background-color: #f0f0f0;
}

.member-info, .item-info {
  flex: 1;
}

.member-name, .item-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-email, .item-type {
  font-size: 13px;
  color: #666;
}

.admin-badge {
  background-color: #198754;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: normal;
}

.member-actions, .item-actions {
  display: flex;
  gap: 10px;
}

.remove-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

/* New styles for user type badges and management */
.user-type-badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: normal;
  margin-left: 5px;
}

.admin-badge {
  background-color: #198754; /* Green */
  color: white;
}

.normal-badge {
  background-color: #0d6efd; /* Blue */
  color: white;
}

.guest-badge {
  background-color: #6c757d; /* Gray */
  color: white;
}

.user-type-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 15px;
}

.user-type-action {
  margin-right: 10px;
}

.type-select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: white;
}

/* Make sure member cards have enough space for the additional controls */
.member-item {
  padding: 15px;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* System info styles */
.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.info-label {
  font-weight: 500;
  color: #555;
}

.info-value {
  color: #333;
  font-family: monospace;
}
</style>