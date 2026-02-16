<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '@/store/peerStore'

const props = defineProps<{
  status: ConnectionStatus
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
  failed: {
    label: 'CONN_FAILED',
    tooltip: 'Peer connection failed. Try again.',
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
    containerClass: 'border-destructive/30 glow-red',
  },
}

const config = computed(() => statusConfig[props.status])
</script>

<template>
  <div
    class="inline-flex items-center gap-2 px-2.5 py-1 border bg-card/50 transition-all duration-300"
    :class="config.containerClass"
    :title="config.tooltip"
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
    <svg
      v-if="props.status === 'disconnected'"
      xmlns="http://www.w3.org/2000/svg"
      class="w-3 h-3 text-muted-foreground"
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
  </div>
</template>
