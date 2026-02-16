<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '@/store/peerStore'

const props = defineProps<{
  status: ConnectionStatus
  encrypted?: boolean
}>()

const statusConfig: Record<
  ConnectionStatus,
  { label: string; tooltip: string; dotClass: string; textClass: string; containerClass: string }
> = {
  disconnected: {
    label: 'NO PEER CONNECTED',
    tooltip: 'Enter a share code to connect with a peer device.',
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
    containerClass: 'border-border',
  },
  connecting: {
    label: 'CONNECTING...',
    tooltip: 'Establishing peer-to-peer connection...',
    dotClass: 'bg-neon-amber animate-neon-pulse',
    textClass: 'text-neon-amber',
    containerClass: 'border-neon-amber/30 glow-amber',
  },
  connected: {
    label: 'CONNECTED',
    tooltip: 'Peer-to-peer connection active.',
    dotClass: 'bg-neon-green',
    textClass: 'text-neon-green',
    containerClass: 'border-neon-green/30 glow-green',
  },
  connectedEncrypted: {
    label: 'CONNECTED',
    tooltip: 'End-to-end encrypted peer connection.',
    dotClass: 'bg-neon-green',
    textClass: 'text-neon-green',
    containerClass: 'border-neon-green/30 glow-green',
  },
  failed: {
    label: 'CONN_FAILED',
    tooltip: 'Peer connection failed. Try again.',
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
    containerClass: 'border-destructive/30 glow-red',
  },
}

const configKey = computed(() => {
  if (props.status === 'connected' && props.encrypted) return 'connectedEncrypted'
  return props.status
})
const config = computed(() => statusConfig[configKey.value])
</script>

<template>
  <div
    class="connection-badge group relative inline-flex items-center gap-2 px-2.5 py-1 border bg-card/50 transition-all duration-300"
    :class="config.containerClass"
  >
    <div
      class="w-1.5 h-1.5"
      :class="config.dotClass"
    />
    <span
      class="text-[0.625rem] uppercase tracking-wider"
      :class="config.textClass"
    >
      {{ config.label }}
    </span>
    <!-- Lock icon for encrypted connection -->
    <svg
      v-if="props.status === 'connected' && props.encrypted"
      xmlns="http://www.w3.org/2000/svg"
      class="w-3 h-3 text-neon-green"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
    <svg
      v-if="props.status === 'disconnected'"
      xmlns="http://www.w3.org/2000/svg"
      class="w-3.5 h-3.5 text-muted-foreground animate-subtle-blink antialiased"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
    <!-- CSS tooltip -->
    <div
      class="absolute top-full right-0 mt-2 px-2.5 py-1.5 text-[0.625rem] text-neon-cyan/80 bg-card/90 border border-neon-cyan/20 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none"
    >
      {{ config.tooltip }}
    </div>
  </div>
</template>
