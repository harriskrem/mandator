<script setup lang="ts">
import { onMounted } from 'vue'
import { useSocketStore } from './store/socketStore'

const socketStore = useSocketStore()

onMounted(() => {
  socketStore.initializeSocket()
})
</script>

<template>
  <!-- CRT scanline overlay -->
  <div
    class="crt-overlay"
    aria-hidden="true"
  />
  <!-- Noise grain -->
  <div
    class="noise-grain"
    aria-hidden="true"
  />
  <router-view />
</template>
