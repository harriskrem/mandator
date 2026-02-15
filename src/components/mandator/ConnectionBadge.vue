<script setup lang="ts">
import { computed } from 'vue'
import type { ConnectionStatus } from '@/store/peerStore'

const props = defineProps<{
  status: ConnectionStatus
}>()

const statusConfig: Record<
  ConnectionStatus,
  { label: string; dotClass: string; textClass: string; containerClass: string }
> = {
  disconnected: {
    label: 'OFFLINE',
    dotClass: 'bg-muted-foreground',
    textClass: 'text-muted-foreground',
    containerClass: 'border-border',
  },
  connecting: {
    label: 'CONNECTING...',
    dotClass: 'bg-neon-amber animate-neon-pulse',
    textClass: 'text-neon-amber',
    containerClass: 'border-neon-amber/30 glow-amber',
  },
  connected: {
    label: 'CONNECTED',
    dotClass: 'bg-neon-green',
    textClass: 'text-neon-green',
    containerClass: 'border-neon-green/30 glow-green',
  },
  failed: {
    label: 'CONN_FAILED',
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
  </div>
</template>
