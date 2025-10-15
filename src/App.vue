<template>
  <div id="app">
    <DarkModeToggle />
    <router-view />
  </div>
</template>

<script>
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import { initDarkMode } from '@/utils/darkMode'

export default {
  name: 'App',
  components: {
    DarkModeToggle
  },
  mounted() {
    // Initialize dark mode on app load
    initDarkMode()
  }
}
</script>

<style>
/* Global styles if needed */
</style>