<script setup lang="ts">
import ConnectionBadge from "@/components/mandator/ConnectionBadge.vue";
import DropZone from "@/components/mandator/DropZone.vue";
import PixelProgressBar from "@/components/mandator/PixelProgressBar.vue";
import ModalScanQr from "@/components/modal/ScanQr.vue";
import { useDataStore } from "@/store/dataStore";
import { usePeerStore } from "@/store/peerStore";
import { computed, ref, toRefs } from "vue";

const props = defineProps<{
  isSendButtonDisabled: boolean;
}>();
const { isSendButtonDisabled } = toRefs(props);

const emit = defineEmits<{
  (e: "handleSendButton"): void;
  (e: "qrDetect", a: any[]): void;
  (e: "handleFileSelection", a: Event): void;
  (e: "filesDropped", a: File[]): void;
}>();

const dataStore = useDataStore();
const peerStore = usePeerStore();
const filesToSend = computed(() => dataStore.filesToSend);
const connectionStatus = computed(() => peerStore.connectionStatus);
const connectionError = computed(() => peerStore.connectionError);
const transferError = computed(() => dataStore.transferError);

const remoteId = computed({
  get: () => peerStore.remoteId,
  set: (value: string) => peerStore.setRemoteId(value),
});

const scanQr = ref(false);
const toggleScan = () => (scanQr.value = !scanQr.value);

const handleOnQrDetect = (detectedCodes: any[]) => {
  if (detectedCodes[0].rawValue) {
    scanQr.value = false;
    emit("qrDetect", detectedCodes);
  }
};

const fileSendEntries = computed(() => Object.entries(filesToSend.value));

const getProgressPercent = (file: { progress: number; file: File }) => {
  if (file.file.size === 0) return 0;
  return Math.round((file.progress / file.file.size) * 100);
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
</script>

<template>
  <modal-scan-qr
    v-model:show-modal="scanQr"
    :scan-qr="true"
    @camera-detect="handleOnQrDetect"
  />

  <div class="flex flex-col gap-5">
    <!-- Connection status badge -->
    <div class="flex justify-end">
      <connection-badge :status="connectionStatus" />
    </div>

    <!-- Error alert - retro terminal style -->
    <div
      v-if="connectionError"
      class="border border-destructive/30 bg-destructive/5 p-3 glow-red"
    >
      <div class="flex items-start gap-2">
        <span class="text-[0.625rem] text-destructive shrink-0 mt-0.5 uppercase tracking-wider">
          [err]
        </span>
        <p class="text-xs text-destructive/80">
          {{ connectionError }}
        </p>
      </div>
    </div>

    <!-- Transfer error -->
    <div
      v-if="transferError"
      class="border border-destructive/30 bg-destructive/5 p-3 glow-red"
    >
      <div class="flex items-start gap-2">
        <span class="text-[0.625rem] text-destructive shrink-0 mt-0.5 uppercase tracking-wider">
          [err]
        </span>
        <p class="text-xs text-destructive/80">
          Transfer error: {{ transferError.message }}
        </p>
      </div>
    </div>

    <!-- Peer code input -->
    <div>
      <label class="block text-[0.625rem] text-muted-foreground mb-2 uppercase tracking-wider">
        $ remote_peer --code
      </label>
      <div class="flex gap-2">
        <input
          v-model="remoteId"
          type="text"
          class="flex-1 h-9 border border-border bg-secondary/30 px-3 text-sm text-neon-cyan placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all font-mono tracking-wider"
          placeholder="enter share code..."
        />
        <button
          type="button"
          class="h-9 w-9 border border-border bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all duration-300"
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
        </button>
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
          <div class="shrink-0">
            <pixel-progress-bar
              :progress="getProgressPercent(sendingFile)"
              :complete="sendingFile.progress > 0 && sendingFile.progress === sendingFile.file.size"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Send button -->
    <button
      type="button"
      :disabled="isSendButtonDisabled"
      class="w-full h-11 border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neon-cyan/20 hover:border-neon-cyan glow-cyan hover:glow-cyan-strong transition-all duration-300 disabled:opacity-30 disabled:pointer-events-none"
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
    </button>
  </div>
</template>
