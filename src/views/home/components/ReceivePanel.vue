<script setup lang="ts">
import PixelProgressBar from "@/components/fides/PixelProgressBar.vue";
import ModalScanQr from "@/components/modal/ScanQr.vue";
import { useDataStore } from "@/store/dataStore";
import { computed, ref, toRefs } from "vue";

const shareBaseUrl = import.meta.env.VITE_SHARE_BASE_URL || "https://tobefilled.tech";

const props = defineProps<{
  clientId: string;
}>();
const { clientId } = toRefs(props);

defineEmits<{
  (a: "saveFile", b: string): void;
}>();

const dataStore = useDataStore();
const incomingFiles = computed(() => dataStore.filesToReceive);
const showUrl = ref(false);
const copied = ref(false);
const showQrModal = ref(false);

const toggleQrModal = () => (showQrModal.value = !showQrModal.value);

const getShareUrl = () => {
  const id = encodeURIComponent(clientId.value);
  return `${shareBaseUrl}/${id}`;
};

const displayValue = computed(() => {
  return showUrl.value ? getShareUrl() : clientId.value;
});

const copyToClipboard = () => {
  navigator.clipboard.writeText(displayValue.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const incomingEntries = computed(() => Object.entries(incomingFiles.value));

const getProgressPercent = (file: { progress: number; size: number }) => {
  if (file.size === 0) return 0;
  return Math.round((file.progress / file.size) * 100);
};

const isComplete = (file: { progress: number; size: number }) => {
  return file.progress > 0 && file.progress === file.size;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const integrityConfig = {
  verified: {
    label: "SHA256_OK",
    className: "border-neon-green/30 bg-neon-green/10 text-neon-green glow-green",
  },
  corrupted: {
    label: "HASH_FAIL",
    className: "border-destructive/30 bg-destructive/10 text-destructive glow-red",
  },
  unverified: {
    label: "NO_HASH",
    className: "border-neon-amber/30 bg-neon-amber/10 text-neon-amber glow-amber",
  },
};

const getIntegrityStatus = (file: { verified?: boolean | null }) => {
  if (file.verified === true) return "verified" as const;
  if (file.verified === false) return "corrupted" as const;
  return "unverified" as const;
};
</script>

<template>
  <modal-scan-qr
    v-model:show-modal="showQrModal"
    :self-code="clientId"
  />

  <div class="flex flex-col gap-5">
    <!-- Toggle label + switch -->
    <div class="flex items-center justify-between">
      <label class="text-[10px] text-muted-foreground uppercase tracking-wider">
        {{ showUrl ? "$ echo $SHARE_URL" : "$ echo $SHARE_CODE" }}
      </label>
      <button
        type="button"
        class="relative h-5 w-9 border border-border bg-secondary/30 transition-all duration-300 hover:border-neon-magenta/30"
        role="switch"
        :aria-checked="showUrl"
        aria-label="Toggle between code and URL"
        @click="showUrl = !showUrl"
      >
        <div
          class="absolute top-0.5 h-3 w-3 transition-all duration-300"
          :class="
            showUrl
              ? 'left-[18px] bg-neon-magenta shadow-[0_0_6px_hsl(320_80%_60%/0.5)]'
              : 'left-0.5 bg-muted-foreground'
          "
        />
      </button>
    </div>

    <!-- Share code/URL display -->
    <div
      v-if="!clientId"
      class="border border-neon-cyan/20 bg-neon-cyan/5 p-3 flex items-center gap-2"
    >
      <!-- Info icon -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-4 h-4 text-neon-cyan/60 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      <p class="text-xs text-neon-cyan/60">
        awaiting peer connection...
      </p>
      <div class="ml-auto flex gap-1">
        <div
          class="w-1 h-1 bg-neon-cyan animate-bounce"
          style="animation-delay: 0s"
        />
        <div
          class="w-1 h-1 bg-neon-cyan animate-bounce"
          style="animation-delay: 0.15s"
        />
        <div
          class="w-1 h-1 bg-neon-cyan animate-bounce"
          style="animation-delay: 0.3s"
        />
      </div>
    </div>

    <template v-else>
      <div class="flex gap-2">
        <input
          type="text"
          readonly
          :value="displayValue"
          class="flex-1 h-9 border border-neon-magenta/30 bg-secondary/30 px-3 text-sm text-neon-magenta tracking-wider focus:outline-none font-mono"
        />
        <button
          type="button"
          class="h-9 w-9 border border-border bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-neon-magenta hover:border-neon-magenta/30 hover:bg-neon-magenta/5 transition-all duration-300"
          aria-label="Show QR code"
          @click="toggleQrModal"
        >
          <!-- QrCode icon -->
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
            <rect
              width="5"
              height="5"
              x="3"
              y="3"
              rx="1"
            />
            <rect
              width="5"
              height="5"
              x="16"
              y="3"
              rx="1"
            />
            <rect
              width="5"
              height="5"
              x="3"
              y="16"
              rx="1"
            />
            <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
            <path d="M21 21v.01" />
            <path d="M12 7v3a2 2 0 0 1-2 2H7" />
            <path d="M3 12h.01" />
            <path d="M12 3h.01" />
            <path d="M12 16v.01" />
            <path d="M16 12h1" />
            <path d="M21 12v.01" />
            <path d="M12 21v-1" />
          </svg>
        </button>
        <button
          type="button"
          class="h-9 w-9 border border-border bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all duration-300"
          aria-label="Copy to clipboard"
          @click="copyToClipboard"
        >
          <!-- Check / Copy icon -->
          <svg
            v-if="copied"
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4 text-neon-green"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              width="14"
              height="14"
              x="8"
              y="8"
              rx="2"
              ry="2"
            />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </button>
      </div>
    </template>

    <!-- Incoming files table -->
    <div
      v-if="incomingEntries.length > 0"
      class="border border-border bg-card/30 overflow-hidden"
    >
      <div class="px-3 py-2 border-b border-border bg-secondary/30 flex items-center gap-2">
        <span class="text-[10px] text-muted-foreground/60">&gt;</span>
        <h3 class="text-[10px] text-muted-foreground uppercase tracking-wider">
          incoming_files ({{ incomingEntries.length }})
        </h3>
      </div>
      <div class="divide-y divide-border/50">
        <div
          v-for="[fileHash, receivingFile] in incomingEntries"
          :key="fileHash"
          class="px-3 py-2.5 flex items-center gap-4"
        >
          <div class="flex-1 min-w-0">
            <p class="text-xs text-foreground truncate">
              {{ receivingFile.filename }}
            </p>
            <p class="text-[10px] text-muted-foreground/60 mt-0.5">
              {{ formatSize(receivingFile.size) }}
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-2">
            <template v-if="!isComplete(receivingFile)">
              <pixel-progress-bar
                :progress="getProgressPercent(receivingFile)"
                color="magenta"
              />
            </template>
            <template v-else>
              <span
                class="inline-flex items-center px-2 py-0.5 border text-[9px] uppercase tracking-wider"
                :class="integrityConfig[getIntegrityStatus(receivingFile)].className"
              >
                {{ integrityConfig[getIntegrityStatus(receivingFile)].label }}
              </span>
              <button
                type="button"
                class="h-7 w-7 border border-border bg-secondary/30 flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5 transition-all duration-300"
                :aria-label="`Download ${receivingFile.filename}`"
                @click="$emit('saveFile', fileHash)"
              >
                <!-- Download icon -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-3 h-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line
                    x1="12"
                    y1="15"
                    x2="12"
                    y2="3"
                  />
                </svg>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
