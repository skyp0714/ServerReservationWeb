<template>
  <button @click="toggleDark" class="dark-mode-toggle" :title="isDark.isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
    <!-- Moon icon for dark mode -->
    <svg v-if="!isDark.isDark" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
    <!-- Sun icon for light mode -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  </button>
</template>

<script>
import { useDarkMode } from '@/utils/darkMode'

export default {
  name: 'DarkModeToggle',
  setup() {
    const { isDark, toggle } = useDarkMode()

    return {
      isDark,
      toggleDark: toggle
    }
  }
}
</script>

<style scoped>
.dark-mode-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #f0f0f0;
  border: 2px solid #ddd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dark-mode-toggle:hover {
  background-color: #e0e0e0;
  transform: scale(1.1);
}

.dark-mode-toggle svg {
  color: #333;
}

/* Dark mode styles */
:global(body.dark-mode) .dark-mode-toggle {
  background-color: #2d2d2d;
  border-color: #444;
}

:global(body.dark-mode) .dark-mode-toggle:hover {
  background-color: #3d3d3d;
}

:global(body.dark-mode) .dark-mode-toggle svg {
  color: #ffd700;
}
</style>
