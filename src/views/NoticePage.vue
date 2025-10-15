<template>
  <div class="notices-page">
    <!-- Home icon button -->
    <router-link to="/home" class="home-icon-button" title="Home">
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </router-link>
    
    <h2>Notices & Announcements</h2>
    
    <!-- Announcements section -->
    <div class="announcements-section">
      <div class="section-header">
        <h3>Announcements</h3>
        <button @click="showAnnouncementModal = true" class="post-announcement-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
          </svg>
          Post Announcement
        </button>
      </div>
      
      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-filter">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search announcements..."
            class="search-input">
        </div>
        <div class="category-filter">
          <select v-model="selectedCategory" class="category-select">
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <button v-if="searchQuery || selectedCategory" @click="clearFilters" class="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      <!-- Pinned Announcements -->
      <div v-if="pinnedAnnouncements.length > 0" class="pinned-section">
        <h4 class="pinned-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="pin-icon">
            <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
          </svg>
          Pinned Announcements
        </h4>
        <div class="pinned-list">
          <div v-for="announcement in pinnedAnnouncements" :key="'pinned-' + announcement.id"
               class="announcement-item-slim pinned"
               @click="viewAnnouncement(announcement)">
            <div class="pinned-indicator">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
              </svg>
            </div>
            <div class="announcement-slim-content">
              <span class="announcement-title">{{ announcement.title }}</span>
              <span class="announcement-category-slim">{{ announcement.category }}</span>
            </div>
            <div class="announcement-actions" v-if="canManageAnnouncement(announcement)" @click.stop>
              <button @click="editAnnouncement(announcement)" class="edit-btn" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button @click="togglePin(announcement)" class="pin-btn" title="Unpin">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                </svg>
              </button>
              <button @click="deleteAnnouncement(announcement)" class="delete-btn" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Regular Announcements -->
      <div class="announcements-list">
        <div v-if="filteredAnnouncements.length === 0" class="empty-state">
          <p v-if="searchQuery || selectedCategory">No announcements match your filters.</p>
          <p v-else>No announcements at this time.</p>
        </div>
        <div v-else>
          <div v-for="announcement in paginatedAnnouncements" :key="announcement.id" 
               class="announcement-item-slim"
               @click="viewAnnouncement(announcement)">
            <div class="announcement-slim-content">
              <span class="announcement-title">{{ announcement.title }}</span>
              <span class="announcement-category-slim">{{ announcement.category }}</span>
            </div>
            <div class="announcement-actions" v-if="canManageAnnouncement(announcement)" @click.stop>
              <button @click="editAnnouncement(announcement)" class="edit-btn" title="Edit">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button v-if="isAdmin" @click="togglePin(announcement)" class="pin-btn-outline" title="Pin">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/>
                </svg>
              </button>
              <button @click="deleteAnnouncement(announcement)" class="delete-btn" title="Delete">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
          Previous
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="currentPage = Math.min(totalPages, currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn">
          Next
        </button>
      </div>
    </div>

    <!-- Bug reports section (collapsible) -->
    <div class="bug-reports-section">
      <div class="collapsible-header" @click="bugSectionExpanded = !bugSectionExpanded">
        <h3>⚠ Bug Fix Tracking</h3>
        <span class="expand-icon" :class="{ expanded: bugSectionExpanded }">▼</span>
      </div>
      
      <div v-if="bugSectionExpanded" class="collapsible-content">
        <div class="section-header">
          <p v-if="!isAdmin" class="admin-message">Only administrators can update bug status</p>
        </div>
        
        <!-- Active Bugs -->
        <div class="active-bugs">
          <h4>Active Issues</h4>
          <p v-if="activeBugs.length === 0">No active bug reports.</p>
          <div v-else class="bug-list">
            <div v-for="bug in activeBugs" :key="bug.id" class="bug-item">
              <div class="bug-header">
                <label class="bug-checkbox-container">
                  <input 
                    type="checkbox" 
                    v-model="bug.completed"
                    @change="updateBugStatus(bug)"
                    :disabled="!isAdmin">
                  <span class="bug-title">{{ bug.title }}</span>
                </label>
                <div class="bug-tags">
                  <span class="bug-priority" :class="'priority-' + bug.priority">{{ bug.priority }}</span>
                  <span v-if="bug.page" class="bug-page-tag">{{ bug.page }}</span>
                </div>
              </div>
              <div class="bug-description">{{ bug.description }}</div>
              <div class="bug-meta">
                <span>Reported by: {{ bug.submittedBy }}</span>
                <span>{{ formatDate(bug.submittedAt) }}</span>
              </div>
              <div v-if="isAdmin" class="bug-controls">
                <button @click="deleteBugReport(bug)" class="delete-bug-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Completed Bugs (sub-collapsible) -->
        <div class="completed-bugs">
          <div class="collapsible-header" @click="completedBugsExpanded = !completedBugsExpanded">
            <h4>✓ Completed Fixes ({{ completedBugs.length }})</h4>
            <span class="expand-icon" :class="{ expanded: completedBugsExpanded }">▼</span>
          </div>
          
          <div v-if="completedBugsExpanded" class="collapsible-content">
            <p v-if="completedBugs.length === 0">No completed bug fixes.</p>
            <div v-else class="bug-list">
              <div v-for="bug in completedBugs" :key="bug.id" class="bug-item completed">
                <div class="bug-header">
                  <label class="bug-checkbox-container">
                    <input 
                      type="checkbox" 
                      v-model="bug.completed"
                      @change="updateBugStatus(bug)"
                      :disabled="!isAdmin">
                    <span class="bug-title">{{ bug.title }}</span>
                  </label>
                  <div class="bug-tags">
                    <span class="bug-priority" :class="'priority-' + bug.priority">{{ bug.priority }}</span>
                    <span v-if="bug.page" class="bug-page-tag">{{ bug.page }}</span>
                  </div>
                </div>
                <div class="bug-description">{{ bug.description }}</div>
                <div class="bug-meta">
                  <span>Reported by: {{ bug.submittedBy }}</span>
                  <span>{{ formatDate(bug.submittedAt) }}</span>
                </div>
                <div v-if="isAdmin" class="bug-controls">
                  <button @click="deleteBugReport(bug)" class="delete-bug-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Announcement Modal -->
    <div v-if="showAnnouncementModal" class="modal-overlay" @click="closeAnnouncementModal">
      <div class="modal announcement-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingAnnouncement ? 'Edit Announcement' : 'Post New Announcement' }}</h3>
          <button @click="closeAnnouncementModal" class="close-button">×</button>
        </div>
        <div class="modal-content">
          <div class="form-group">
            <label for="announcementTitle">Title *</label>
            <input 
              id="announcementTitle"
              v-model="announcementForm.title" 
              type="text" 
              required 
              maxlength="100"
              class="form-input"
              placeholder="Enter announcement title">
          </div>
          
          <div class="form-group">
            <label for="announcementCategory">Category *</label>
            <select id="announcementCategory" v-model="announcementForm.category" required class="form-select">
              <option value="">Select Category</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="announcementContent">Content *</label>
            <div class="text-editor">
              <div class="editor-toolbar">
                <button type="button" @click="formatText('bold')" class="editor-btn" title="Bold">
                  <strong>B</strong>
                </button>
                <button type="button" @click="formatText('italic')" class="editor-btn" title="Italic">
                  <em>I</em>
                </button>
                <button type="button" @click="formatText('underline')" class="editor-btn" title="Underline">
                  <span style="text-decoration: underline">U</span>
                </button>
                <button type="button" @click="insertList()" class="editor-btn" title="Bullet List">
                  •
                </button>
              </div>
              <div 
                ref="contentEditor"
                contenteditable="true"
                @input="updateContent"
                @paste="handlePaste"
                class="content-editor"
                :placeholder="announcementForm.content ? '' : 'Enter announcement content (max 1000 characters)'"
              ></div>
              <div class="character-count">{{ getContentLength() }}/1000</div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeAnnouncementModal" class="cancel-btn">Cancel</button>
            <button type="button" @click="submitAnnouncement" class="submit-btn">
              {{ editingAnnouncement ? 'Update' : 'Post' }} Announcement
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Announcement Detail Modal -->
    <div v-if="showAnnouncementDetail" class="modal-overlay" @click="closeAnnouncementDetail">
      <div class="modal announcement-detail-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ viewingAnnouncement?.title }}</h3>
          <button @click="closeAnnouncementDetail" class="close-button">×</button>
        </div>
        <div class="modal-content">
          <div class="announcement-detail-category">
            <span class="category-badge">{{ viewingAnnouncement?.category }}</span>
          </div>
          <div class="announcement-detail-content" v-html="linkifyText(viewingAnnouncement?.content)"></div>
          <div class="announcement-detail-meta">
            <p><strong>Author:</strong> {{ viewingAnnouncement?.author }}</p>
            <p><strong>Posted:</strong> {{ formatDate(viewingAnnouncement?.createdAt) }}</p>
            <p v-if="viewingAnnouncement?.updatedAt && viewingAnnouncement?.updatedAt !== viewingAnnouncement?.createdAt">
              <strong>Last edited:</strong> {{ formatDate(viewingAnnouncement?.updatedAt) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { firestore, auth, getUserRole } from '@/firebase'
import { collection, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { dailyCache } from '@/utils/dailyCache'
import '@/assets/styles/components/NoticePage.css'

export default {
  name: 'NoticesPage',
  data() {
    return {
      // Announcements
      announcements: [],
      pinnedAnnouncements: [],
      searchQuery: '',
      selectedCategory: '',
      currentPage: 1,
      itemsPerPage: 10,

      // Bug tracking
      bugs: [],
      bugSectionExpanded: false,
      completedBugsExpanded: false,

      // Modal and forms
      showAnnouncementModal: false,
      editingAnnouncement: null,
      showAnnouncementDetail: false,
      viewingAnnouncement: null,
      announcementForm: {
        title: '',
        content: '',
        category: ''
      },

      // Categories
      categories: [
        'General',
        'Maintenance',
        'New Feature',
        'System Update',
        'Emergency',
        'Tutorial',
        'Policy'
      ],

      // Current user
      currentUser: null,
      userRole: 'guest' // Track user role reactively
    }
  },
  computed: {
    isAdmin() {
      return this.userRole === 'admin'
    },
    
    currentUsername() {
      return this.currentUser ? this.currentUser.email.split('@')[0] : ''
    },
    
    filteredAnnouncements() {
      let filtered = this.announcements.filter(announcement => !announcement.pinned)
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(announcement => 
          announcement.title.toLowerCase().includes(query) ||
          announcement.content.toLowerCase().includes(query) ||
          announcement.author.toLowerCase().includes(query)
        )
      }
      
      if (this.selectedCategory) {
        filtered = filtered.filter(announcement => 
          announcement.category === this.selectedCategory
        )
      }
      
      return filtered
    },
    
    paginatedAnnouncements() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredAnnouncements.slice(start, end)
    },
    
    totalPages() {
      return Math.ceil(this.filteredAnnouncements.length / this.itemsPerPage)
    },
    
    activeBugs() {
      return this.bugs.filter(bug => !bug.completed)
    },
    
    completedBugs() {
      return this.bugs.filter(bug => bug.completed)
    }
  },
  watch: {
    searchQuery() {
      this.currentPage = 1
    },
    selectedCategory() {
      this.currentPage = 1
    }
  },
  methods: {
    // Convert URLs in text to clickable links
    linkifyText(text) {
      if (!text) return '';

      // Regular expression to match URLs (http://, https://, www.)
      const urlRegex = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)/g;

      // Replace URLs with anchor tags
      return text.replace(urlRegex, (match) => {
        // Add https:// if the URL starts with www.
        const href = match.startsWith('www.') ? `https://${match}` : match;
        return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="auto-link">${match}</a>`;
      });
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    },
    
    clearFilters() {
      this.searchQuery = ''
      this.selectedCategory = ''
      this.currentPage = 1
    },
    
    canManageAnnouncement(announcement) {
      return this.isAdmin || (announcement.authorEmail === this.currentUser?.email)
    },
    
    async submitAnnouncement() {
      // Update content from editor
      this.updateContent()
      
      const contentText = this.$refs.contentEditor ? this.$refs.contentEditor.innerText.trim() : ''
      
      if (!this.announcementForm.title.trim() || !contentText || !this.announcementForm.category) {
        alert('Please fill in all required fields.')
        return
      }
      
      if (contentText.length > 1000) {
        alert('Content must be 1000 characters or less.')
        return
      }
      
      if (!this.currentUser || !this.currentUser.email) {
        alert('Please log in to post announcements.')
        return
      }
      
      try {
        const announcementData = {
          title: this.announcementForm.title.trim(),
          content: this.announcementForm.content.trim(),
          category: this.announcementForm.category,
          author: this.currentUsername,
          authorEmail: this.currentUser.email,
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        if (this.editingAnnouncement) {
          announcementData.createdAt = this.editingAnnouncement.createdAt
          await updateDoc(doc(firestore, 'announcements', this.editingAnnouncement.id), announcementData)
        } else {
          await addDoc(collection(firestore, 'announcements'), announcementData)
        }
        
        // Refresh cache to show changes immediately
        await this.refreshAnnouncementCache()
        
        // Force close modal immediately after successful operation
        this.showAnnouncementModal = false
        this.editingAnnouncement = null
        this.announcementForm = {
          title: '',
          content: '',
          category: ''
        }
      } catch (error) {
        console.error('Error saving announcement:', error)
        alert('Failed to save announcement: ' + error.message)
      }
    },
    
    editAnnouncement(announcement) {
      this.editingAnnouncement = announcement
      this.announcementForm = {
        title: announcement.title,
        content: announcement.content,
        category: announcement.category
      }
      this.showAnnouncementModal = true
      // Set content in editor after modal opens
      this.$nextTick(() => {
        if (this.$refs.contentEditor) {
          this.$refs.contentEditor.innerHTML = announcement.content
        }
      })
    },
    
    async deleteAnnouncement(announcement) {
      if (confirm(`Are you sure you want to delete "${announcement.title}"?`)) {
        try {
          await deleteDoc(doc(firestore, 'announcements', announcement.id))
          // Refresh cache to show changes immediately
          await this.refreshAnnouncementCache()
        } catch (error) {
          console.error('Error deleting announcement:', error)
          alert('Failed to delete announcement: ' + error.message)
        }
      }
    },
    
    async togglePin(announcement) {
      try {
        await updateDoc(doc(firestore, 'announcements', announcement.id), {
          pinned: !announcement.pinned,
          updatedAt: new Date().toISOString()
        })
        // Refresh cache to show changes immediately
        await this.refreshAnnouncementCache()
      } catch (error) {
        console.error('Error toggling pin:', error)
        alert('Failed to update pin status: ' + error.message)
      }
    },
    
    closeAnnouncementModal() {
      this.showAnnouncementModal = false
      this.editingAnnouncement = null
      this.announcementForm = {
        title: '',
        content: '',
        category: ''
      }
    },
    
    viewAnnouncement(announcement) {
      this.viewingAnnouncement = announcement
      this.showAnnouncementDetail = true
    },
    
    closeAnnouncementDetail() {
      this.showAnnouncementDetail = false
      this.viewingAnnouncement = null
    },
    
    // Text editor methods
    formatText(command) {
      document.execCommand(command, false, null)
      this.$refs.contentEditor.focus()
    },
    
    insertList() {
      document.execCommand('insertUnorderedList', false, null)
      this.$refs.contentEditor.focus()
    },
    
    updateContent() {
      this.announcementForm.content = this.$refs.contentEditor.innerHTML
    },
    
    getContentLength() {
      return this.$refs.contentEditor ? this.$refs.contentEditor.innerText.length : 0
    },
    
    handlePaste(e) {
      e.preventDefault()
      const text = (e.clipboardData || window.clipboardData).getData('text/plain')
      document.execCommand('insertText', false, text)
    },
    
    // Bug tracking methods (preserved from original)
    async updateBugStatus(bug) {
      if (!this.isAdmin) {
        console.log('Non-admin attempted to update bug status')
        return
      }
      
      try {
        await updateDoc(doc(firestore, 'bugs', bug.id), { 
          completed: bug.completed
        })
        console.log(`Bug status updated to ${bug.completed ? 'completed' : 'pending'}`)
        // Refresh cache to show changes immediately
        await this.refreshAnnouncementCache()
      } catch (error) {
        console.error('Error updating bug status:', error)
        bug.completed = !bug.completed
      }
    },
    
    async deleteBugReport(bug) {
      if (!this.isAdmin) {
        alert('You must be an administrator to remove bug reports.')
        return
      }
      
      if (confirm(`Are you sure you want to delete the bug report: "${bug.title}"?`)) {
        try {
          await deleteDoc(doc(firestore, 'bugs', bug.id))
          console.log('Bug report deleted successfully')
          // Refresh cache to show changes immediately
          await this.refreshAnnouncementCache()
        } catch (error) {
          console.error('Error deleting bug report:', error)
          alert('Failed to delete bug report: ' + error.message)
        }
      }
    },
    
    getPriorityWeight(priority) {
      const weights = { 'high': 3, 'medium': 2, 'low': 1 }
      return weights[priority] || 0
    },
    
    loadData() {
      this.currentUser = auth.currentUser
      
      // Load data using daily cache
      this.loadAnnouncements();
      this.loadBugs();
    },

    // Load announcements using daily cache
    async loadAnnouncements() {
      try {
        const announcements = await dailyCache.loadData('announcements');
        // Sort by createdAt desc and take first 10
        const sortedAnnouncements = announcements
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
          
        this.announcements = sortedAnnouncements.filter(a => !a.pinned);
        this.pinnedAnnouncements = sortedAnnouncements.filter(a => a.pinned);
        console.log('Loaded announcements:', sortedAnnouncements.length);
      } catch (error) {
        console.error('Error loading announcements:', error);
        this.announcements = [];
        this.pinnedAnnouncements = [];
      }
    },

    // Load bugs using daily cache
    async loadBugs() {
      try {
        const bugs = await dailyCache.loadData('bugs');
        this.bugs = bugs
          .sort((a, b) => {
            if (a.completed !== b.completed) {
              return a.completed ? 1 : -1
            }
            
            const priorityA = this.getPriorityWeight(a.priority)
            const priorityB = this.getPriorityWeight(b.priority)
            
            if (priorityA !== priorityB) {
              return priorityB - priorityA
            }
            
            return new Date(b.submittedAt) - new Date(a.submittedAt)
          });
        console.log('Loaded bugs:', this.bugs.length);
      } catch (error) {
        console.error('Error loading bugs:', error);
        this.bugs = [];
      }
    },

    // Refresh announcement cache after changes
    async refreshAnnouncementCache() {
      try {
        // Force refresh data from Firebase
        const announcements = await dailyCache.refreshData('announcements');
        const bugs = await dailyCache.refreshData('bugs');
        
        // Sort and set announcements
        const sortedAnnouncements = announcements
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);
        this.announcements = sortedAnnouncements.filter(a => !a.pinned);
        this.pinnedAnnouncements = sortedAnnouncements.filter(a => a.pinned);
        
        // Sort and set bugs
        this.bugs = bugs.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1
          }
          const priorityA = this.getPriorityWeight(a.priority)
          const priorityB = this.getPriorityWeight(b.priority)
          if (priorityA !== priorityB) {
            return priorityB - priorityA
          }
          return new Date(b.submittedAt) - new Date(a.submittedAt)
        });
        
        console.log('Cache refreshed - Announcements:', announcements.length, 'Bugs:', bugs.length);
      } catch (error) {
        console.error('Error refreshing cache:', error);
      }
    }
  },
  created() {
    this.loadData()
  },
  mounted() {
    // Listen for auth state changes and update user role
    this.authUnsubscribe = onAuthStateChanged(auth, async (user) => {
      this.currentUser = user
      if (user) {
        const role = await getUserRole()
        this.userRole = role
      } else {
        this.userRole = 'guest'
      }
    })
  },
  beforeUnmount() {
    // Clean up auth listener
    if (this.authUnsubscribe) {
      this.authUnsubscribe()
    }
  }
}
</script>