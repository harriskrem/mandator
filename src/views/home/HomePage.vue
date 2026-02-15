<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import HeroSection from '@/components/mandator/HeroSection.vue'
import TerminalTitleBar from '@/components/mandator/TerminalTitleBar.vue'
import { useWebRTC } from '@/composables/useWebRTC'
import { useDataStore } from '@/store/dataStore'
import { usePeerStore } from '@/store/peerStore'
import { useToastStore } from '@/store/toastStore'
import saveFile from '@/utils/saveFile'
import ReceivePanel from './components/ReceivePanel.vue'
import SendPanel from './components/SendPanel.vue'

const route = useRoute()
const peerStore = usePeerStore()
const dataStore = useDataStore()
const toastStore = useToastStore()

const { handleSend } = useWebRTC()

const clientId = computed(() => peerStore.clientId)
const remoteId = computed(() => peerStore.remoteId)
const connectionStatus = computed(() => peerStore.connectionStatus)
const dataChannelStatus = computed(() => peerStore.dataChannelStatus)

const activeTab = ref<'send' | 'receive'>('send')
const tabSwitchDirection = ref<1 | -1>(1)

const hasFiles = computed(() => Object.keys(dataStore.filesToSend).length > 0)

const canSend = computed(() => {
  if (!remoteId.value || !hasFiles.value) return false
  // Allow initiating connection when disconnected/failed
  if (
    connectionStatus.value === 'disconnected' ||
    connectionStatus.value === 'failed'
  )
    return true
  // Allow sending when fully connected with open data channel
  if (
    connectionStatus.value === 'connected' &&
    dataChannelStatus.value === 'open'
  )
    return true
  return false
})

const setActiveTab = (tab: 'send' | 'receive') => {
  if (tab === activeTab.value) return
  tabSwitchDirection.value = tab === 'receive' ? 1 : -1
  activeTab.value = tab
}

const onCameraDetect = (detectedCode: { rawValue: string }[]) => {
  const first = detectedCode[0]
  if (first) {
    peerStore.setRemoteId(first.rawValue)
    toastStore.addToast('QR code scanned', 'info')
  }
}

const onFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files?.length) {
    for (const file of Array.from(input.files)) {
      const fileId = uuidv4()
      dataStore.setFileToSend(fileId, file)
    }
  }
}

const onFilesDropped = (files: File[]) => {
  for (const file of files) {
    const fileId = uuidv4()
    dataStore.setFileToSend(fileId, file)
  }
}

const handleSendButton = () => {
  handleSend()
}

// Share link auto-connect: /:peerId route
onMounted(() => {
  const peerId = route.params.peerId as string | undefined
  if (peerId) {
    peerStore.setRemoteId(peerId)
    setActiveTab('send')

    // Wait for socket connection, then auto-send offer
    const stop = watch(
      clientId,
      (id) => {
        if (id) {
          handleSend()
          stop()
        }
      },
      { immediate: true },
    )
  }
})
</script>

<template>
  <main class="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
    <!-- Ambient glow blobs -->
    <div
      class="fixed top-0 left-1/4 w-[31.25rem] h-[31.25rem] rounded-full opacity-[0.04] blur-[7.5rem] pointer-events-none"
      style="background: hsl(187, 100%, 55%)"
      aria-hidden="true"
    />
    <div
      class="fixed bottom-0 right-1/4 w-[25rem] h-[25rem] rounded-full opacity-[0.03] blur-[6.25rem] pointer-events-none"
      style="background: hsl(320, 80%, 60%)"
      aria-hidden="true"
    />

    <div class="w-full max-w-6xl mx-auto">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
        <!-- Left side: Hero -->
        <div class="w-full lg:w-5/12 flex flex-col">
          <hero-section />
        </div>

        <!-- Right side: Tabbed interface -->
        <div class="w-full lg:w-7/12">
          <div class="border border-border bg-card/40 backdrop-blur-sm overflow-hidden glow-cyan">
            <!-- Terminal title bar -->
            <terminal-title-bar title="~/mandator/transfer" />

            <!-- Tab bar -->
            <div class="relative flex border-b border-border bg-secondary/20">
              <div
                class="cyber-tab-rail pointer-events-none absolute bottom-0 left-0 h-px w-1/2 transition-transform duration-100 [transition-timing-function:steps(3,jump-none)] motion-reduce:transition-none"
                :class="
                  activeTab === 'send'
                    ? 'translate-x-0 bg-neon-cyan/80 glow-cyan'
                    : 'translate-x-full bg-neon-magenta/80 glow-magenta'
                "
                aria-hidden="true"
              />
              <button
                type="button"
                class="flex-1 h-10 border-b border-transparent flex items-center justify-center text-xs uppercase tracking-widest transition-colors duration-200 motion-reduce:transition-none"
                :class="
                  activeTab === 'send'
                    ? 'text-neon-cyan bg-neon-cyan/5 text-glow-cyan'
                    : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/30'
                "
                @click="setActiveTab('send')"
              >
                $ send
              </button>
              <div class="w-px bg-border" />
              <button
                type="button"
                class="flex-1 h-10 border-b border-transparent flex items-center justify-center text-xs uppercase tracking-widest transition-colors duration-200 motion-reduce:transition-none"
                :class="
                  activeTab === 'receive'
                    ? 'text-neon-magenta bg-neon-magenta/5 text-glow-magenta'
                    : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/30'
                "
                @click="setActiveTab('receive')"
              >
                $ receive
              </button>
            </div>

            <!-- Tab content — both wrappers stay in the same grid cell so container height stays stable -->
            <div
              class="cyber-tab-stack p-4 sm:p-5 grid"
              :style="{ '--tab-shift': String(tabSwitchDirection) }"
            >
              <div
                class="cyber-tab-panel col-start-1 row-start-1 motion-reduce:transition-none"
                :class="
                  activeTab === 'send'
                    ? 'cyber-tab-panel--active cyber-tab-panel--cyan'
                    : 'cyber-tab-panel--inactive pointer-events-none select-none'
                "
                :aria-hidden="activeTab !== 'send'"
                :inert="activeTab !== 'send'"
              >
                <send-panel
                  :is-send-button-disabled="!canSend"
                  @qr-detect="onCameraDetect"
                  @handle-file-selection="onFileSelection"
                  @handle-send-button="handleSendButton"
                  @files-dropped="onFilesDropped"
                />
              </div>
              <div
                class="cyber-tab-panel col-start-1 row-start-1 motion-reduce:transition-none"
                :class="
                  activeTab === 'receive'
                    ? 'cyber-tab-panel--active cyber-tab-panel--magenta'
                    : 'cyber-tab-panel--inactive pointer-events-none select-none'
                "
                :aria-hidden="activeTab !== 'receive'"
                :inert="activeTab !== 'receive'"
              >
                <receive-panel
                  :client-id="clientId || ''"
                  @save-file="saveFile"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.cyber-tab-rail {
  filter: drop-shadow(0 0 0.35rem hsl(187 100% 55% / 0.4));
}

.cyber-tab-panel {
  position: relative;
  isolation: isolate;
  will-change: opacity, transform;
}

/* Scanline overlay that sweeps on activation */
.cyber-tab-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    hsl(var(--tab-tone) / 0.06) 2px,
    hsl(var(--tab-tone) / 0.06) 4px
  );
  mix-blend-mode: screen;
  z-index: 10;
}

/* Horizontal glitch-line that flashes across */
.cyber-tab-panel::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  top: 50%;
  pointer-events: none;
  opacity: 0;
  background: hsl(var(--tab-tone) / 0.7);
  box-shadow: 0 0 8px hsl(var(--tab-tone) / 0.5);
  z-index: 11;
}

.cyber-tab-panel--active {
  opacity: 1;
  transform: none;
  z-index: 2;
  animation: tab-glitch-in 350ms steps(4, jump-none) both;
}

.cyber-tab-panel--active::before {
  animation: tab-scanlines 400ms linear both;
}

.cyber-tab-panel--active::after {
  animation: tab-glitch-line 300ms steps(3) both;
}

.cyber-tab-panel--inactive {
  opacity: 0;
  transform: translate3d(0, 0, 0);
  z-index: 1;
  transition: opacity 0ms 150ms;
}

.cyber-tab-panel--cyan {
  --tab-tone: 187 100% 55%;
}

.cyber-tab-panel--magenta {
  --tab-tone: 320 80% 60%;
}

/* Hard glitch entrance — no blur, no scale, just offset + flicker */
@keyframes tab-glitch-in {
  0% {
    opacity: 0;
    transform: translate3d(calc(var(--tab-shift, 1) * 6px), 0, 0);
    clip-path: inset(0 0 100% 0);
  }
  25% {
    opacity: 1;
    transform: translate3d(calc(var(--tab-shift, 1) * -3px), 0, 0);
    clip-path: inset(0 0 20% 0);
  }
  50% {
    opacity: 0.6;
    transform: translate3d(calc(var(--tab-shift, 1) * 2px), 0, 0);
    clip-path: inset(0 0 0 0);
  }
  75% {
    opacity: 1;
    transform: translate3d(calc(var(--tab-shift, 1) * -1px), 0, 0);
    clip-path: inset(0 0 0 0);
  }
  100% {
    opacity: 1;
    transform: none;
    clip-path: inset(0 0 0 0);
  }
}

/* Brief scanline interference */
@keyframes tab-scanlines {
  0% {
    opacity: 0.8;
  }
  60% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
  }
}

/* Horizontal glitch line sweeping through */
@keyframes tab-glitch-line {
  0% {
    opacity: 0.9;
    top: 0%;
  }
  33% {
    opacity: 0.7;
    top: 40%;
  }
  66% {
    opacity: 0.5;
    top: 80%;
  }
  100% {
    opacity: 0;
    top: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cyber-tab-panel,
  .cyber-tab-panel--active,
  .cyber-tab-panel::before,
  .cyber-tab-panel::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
