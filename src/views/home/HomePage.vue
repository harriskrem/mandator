<script setup lang="ts">
import { useDataStore } from "@/store/dataStore";
import { usePeerStore } from "@/store/peerStore";
import saveFile from "@/utils/saveFile";
import { computed, ref, watchEffect } from "vue";
import ReceivePanel from "./components/ReceivePanel.vue";
import SendPanel from "./components/SendPanel.vue";
import HeroSection from "@/components/mandator/HeroSection.vue";
import TerminalTitleBar from "@/components/mandator/TerminalTitleBar.vue";
import { v4 as uuidv4 } from "uuid";
import { useWebRTC } from "@/composables/useWebRTC";

const peerStore = usePeerStore();
const dataStore = useDataStore();

const { handleSend } = useWebRTC();

const clientId = computed(() => peerStore.clientId);
const remoteId = computed(() => peerStore.remoteId);

const activeTab = ref<"send" | "receive">("send");
const tabSwitchDirection = ref<1 | -1>(1);
const isSendButtonDisabled = ref<boolean>(true);

const setActiveTab = (tab: "send" | "receive") => {
  if (tab === activeTab.value) return;
  tabSwitchDirection.value = tab === "receive" ? 1 : -1;
  activeTab.value = tab;
};

const onCameraDetect = (detectedCode: any[]) => {
  peerStore.setRemoteId(detectedCode[0].rawValue);
};

const onFileSelection = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    for (const file of input.files) {
      const fileId = uuidv4();
      dataStore.setFileToSend(fileId, file);
    }
  }
};

const onFilesDropped = (files: File[]) => {
  for (const file of files) {
    const fileId = uuidv4();
    dataStore.setFileToSend(fileId, file);
  }
};

const handleSendButton = () => {
  handleSend();
};

watchEffect(() => {
  if (remoteId.value) {
    isSendButtonDisabled.value = false;
  }
});
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
                class="cyber-tab-rail pointer-events-none absolute bottom-0 left-0 h-px w-1/2 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
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
                  :is-send-button-disabled="isSendButtonDisabled"
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
  will-change: opacity, transform, filter;
  transition:
    opacity 160ms ease-out,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    filter 220ms ease-out;
}

.cyber-tab-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background:
    linear-gradient(
      180deg,
      transparent 0%,
      hsl(var(--tab-tone) / 0.18) 46%,
      transparent 100%
    ),
    repeating-linear-gradient(
      180deg,
      transparent,
      transparent 0.1875rem,
      hsl(var(--tab-tone) / 0.08) 0.1875rem,
      hsl(var(--tab-tone) / 0.08) 0.25rem
    );
  mix-blend-mode: screen;
  transform: translate3d(0, -105%, 0);
  will-change: opacity, transform;
}

.cyber-tab-panel--active {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  filter: blur(0) brightness(1);
  z-index: 2;
  animation: tab-terminal-refresh 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.cyber-tab-panel--active::before {
  animation: tab-scan-sweep 340ms ease-out both;
}

.cyber-tab-panel--inactive {
  opacity: 0;
  transform: translate3d(calc(var(--tab-shift, 1) * -0.35rem), 0.375rem, 0)
    scale(0.992);
  filter: blur(0.1rem) brightness(0.82) saturate(0.86);
  z-index: 1;
}

.cyber-tab-panel--cyan {
  --tab-tone: 187 100% 55%;
}

.cyber-tab-panel--magenta {
  --tab-tone: 320 80% 60%;
}

@keyframes tab-terminal-refresh {
  0% {
    opacity: 0;
    transform: translate3d(calc(var(--tab-shift, 1) * 0.45rem), 0.5rem, 0)
      scale(0.992);
    filter: blur(0.125rem) brightness(1.25) contrast(1.06);
  }
  50% {
    opacity: 0.88;
    transform: translate3d(calc(var(--tab-shift, 1) * 0.12rem), 0.1rem, 0)
      scale(1);
    filter: blur(0.04rem) brightness(1.12) contrast(1.04);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
    filter: blur(0) brightness(1) contrast(1);
  }
}

@keyframes tab-scan-sweep {
  0% {
    opacity: 0;
    transform: translate3d(0, -105%, 0);
  }
  14% {
    opacity: 0.85;
  }
  70% {
    opacity: 0.35;
  }
  100% {
    opacity: 0;
    transform: translate3d(0, 110%, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .cyber-tab-panel,
  .cyber-tab-panel--active,
  .cyber-tab-panel::before {
    animation: none !important;
    transition: none !important;
  }
}
</style>
