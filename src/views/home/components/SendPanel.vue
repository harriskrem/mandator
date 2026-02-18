<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { computed, ref, toRefs } from 'vue'
import DropZone from '@/components/ui/DropZone.vue'
import PixelProgressBar from '@/components/ui/PixelProgressBar.vue'
import ModalScanQr from '@/components/modals/ScanQrModal.vue'
import Button from '@/components/ui/Button.vue'
import { useDataStore } from '@/store/dataStore'
import { usePeerStore } from '@/store/peerStore'

const props = defineProps<{
  isSendButtonDisabled: boolean
}>()
const { isSendButtonDisabled } = toRefs(props)

const emit = defineEmits<{
  (e: 'handleSendButton'): void
  (e: 'qrDetect', a: { rawValue: string }[]): void
  (e: 'handleFileSelection', a: Event): void
  (e: 'filesDropped', a: File[]): void
}>()

const dataStore = useDataStore()
const peerStore = usePeerStore()
const filesToSend = computed(() => dataStore.filesToSend)

const remoteId = computed({
  get: () => peerStore.remoteId,
  set: (value: string) => peerStore.setRemoteId(value),
})

const scanQr = ref(false)
const toggleScan = () => (scanQr.value = !scanQr.value)

const handleOnQrDetect = (detectedCodes: { rawValue: string }[]) => {
  if (detectedCodes[0]?.rawValue) {
    scanQr.value = false
    emit('qrDetect', detectedCodes)
  }
}

const fileSendEntries = computed(() => Object.entries(filesToSend.value))

const getProgressPercent = (file: { progress: number; file: File }) => {
  if (file.file.size === 0) return 0
  return Math.round((file.progress / file.file.size) * 100)
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const handleResend = (fileId: string) => {
  dataStore.markFileForResend(fileId, uuidv4())
  emit('handleSendButton')
}
</script>

<template>
  <modal-scan-qr
    v-model:show-modal="scanQr"
    :scan-qr="true"
    @camera-detect="handleOnQrDetect"
  />

  <div class="flex flex-col gap-5">
    <!-- Peer code input -->
    <div>
      <label class="block text-[0.625rem] text-muted-foreground mb-1 uppercase tracking-wider">
        $ remote_peer --code
      </label>
      <p class="text-[0.625rem] text-muted-foreground/50 mb-2">
        // paste the code from your receiver
      </p>
      <div class="flex gap-2">
        <input
          v-model="remoteId"
          type="text"
          class="flex-1 h-9 border border-border bg-secondary/30 px-3 text-sm text-neon-cyan placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all font-mono tracking-wider"
          placeholder="enter share code..."
        />
        <Button
          variant="icon"
          aria-label="Scan QR code"
          @click="toggleScan"
        >
          <!-- ScanLine icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <line
              x1="7"
              y1="12"
              x2="17"
              y2="12"
            />
          </svg>
        </Button>
      </div>
    </div>

    <!-- Drop zone -->
    <drop-zone
      @files-dropped="(files: File[]) => emit('filesDropped', files)"
      @file-selected="(event: Event) => emit('handleFileSelection', event)"
    />

    <!-- File table -->
    <div
      v-if="fileSendEntries.length"
      class="border border-border bg-card/30 overflow-hidden"
    >
      <div class="px-3 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
        <span class="text-[0.625rem] text-muted-foreground/60">&gt;</span>
        <h3 class="text-[0.625rem] text-muted-foreground uppercase tracking-wider">
          queued_files ({{ fileSendEntries.length }})
        </h3>
      </div>
      <div class="divide-y divide-border/50">
        <div
          v-for="[fileId, sendingFile] in fileSendEntries"
          :key="fileId"
          class="px-3 py-2.5 flex items-center gap-4"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs text-foreground truncate">
              {{ sendingFile.file.name }}
            </p>
            <p class="text-[0.625rem] text-muted-foreground/60 mt-0.5">
              {{ formatSize(sendingFile.file.size) }}
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <pixel-progress-bar
              :progress="getProgressPercent(sendingFile)"
              :complete="sendingFile.sent"
            />
            <button
              v-if="sendingFile.sent"
              type="button"
              class="p-1 text-muted-foreground/60 hover:text-neon-cyan transition-colors duration-200"
              aria-label="Resend file"
              @click="handleResend(fileId)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 21h5v-5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Send button -->
    <Button
      variant="primary"
      size="lg"
      full-width
      :disabled="isSendButtonDisabled"
      @click="emit('handleSendButton')"
    >
      <!-- Send icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </svg>
      $ send --files *
    </Button>
  </div>
</template>
