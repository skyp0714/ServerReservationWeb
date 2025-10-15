// Simple reactive store without Vuex
import { reactive } from 'vue'

// Create a reactive store object
const state = reactive({
  user: null,
  userRole: 'guest',
  isAuthenticated: false,
  darkMode: localStorage.getItem('darkMode') === 'true' || false
})

// Store methods for state updates
const store = {
  // State access
  state,
  
  // User methods
  setUser(user) {
    state.user = user;
    state.isAuthenticated = !!user;
  },
  
  setUserRole(role) {
    state.userRole = role;
  },
  
  toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
  },
  
  // Role helper methods
  isAdmin() {
    return state.userRole === 'admin';
  },
  
  isUser() {
    return state.userRole === 'user' || state.userRole === 'admin';
  },
  
  isGuest() {
    return state.userRole === 'guest';
  }
}

export default store
