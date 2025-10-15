// Dark mode utility
import { reactive } from 'vue'

// Dark mode state - reactive and persisted in localStorage
const darkModeState = reactive({
  isDark: localStorage.getItem('darkMode') === 'true'
})

// Toggle dark mode
export function toggleDarkMode() {
  darkModeState.isDark = !darkModeState.isDark
  localStorage.setItem('darkMode', darkModeState.isDark)
  applyDarkMode()
}

// Apply dark mode class to body
export function applyDarkMode() {
  if (darkModeState.isDark) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

// Get dark mode state
export function useDarkMode() {
  return {
    isDark: darkModeState,
    toggle: toggleDarkMode
  }
}

// Initialize dark mode on app load
export function initDarkMode() {
  applyDarkMode()
}
