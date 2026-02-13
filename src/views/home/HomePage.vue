<script setup lang="ts">
import { useDataStore } from "@/store/dataStore";
import { usePeerStore } from "@/store/peerStore";
import saveFile from "@/utils/saveFile";
import { computed, ref, watchEffect } from "vue";
import ReceivePanel from "./components/ReceivePanel.vue";
import SendPanel from "./components/SendPanel.vue";
import HeroSection from "@/components/fides/HeroSection.vue";
import TerminalTitleBar from "@/components/fides/TerminalTitleBar.vue";
import { v4 as uuidv4 } from "uuid";
import { useWebRTC } from "@/composables/useWebRTC";

const peerStore = usePeerStore();
const dataStore = useDataStore();

const { handleSend } = useWebRTC();

const clientId = computed(() => peerStore.clientId);
const remoteId = computed(() => peerStore.remoteId);

const activeTab = ref<"send" | "receive">("send");
const isSendButtonDisabled = ref<boolean>(true);

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
      class="fixed top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04] blur-[120px] pointer-events-none"
      style="background: hsl(187, 100%, 55%)"
      aria-hidden="true"
    />
    <div
      class="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03] blur-[100px] pointer-events-none"
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
            <terminal-title-bar title="~/fides/transfer" />

            <!-- Tab bar -->
            <div class="flex border-b border-border bg-secondary/20">
              <button
                type="button"
                class="flex-1 h-10 flex items-center justify-center text-xs uppercase tracking-widest transition-all duration-300"
                :class="
                  activeTab === 'send'
                    ? 'text-neon-cyan border-b border-neon-cyan bg-neon-cyan/5 text-glow-cyan'
                    : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/30'
                "
                @click="activeTab = 'send'"
              >
                $ send
              </button>
              <div class="w-px bg-border" />
              <button
                type="button"
                class="flex-1 h-10 flex items-center justify-center text-xs uppercase tracking-widest transition-all duration-300"
                :class="
                  activeTab === 'receive'
                    ? 'text-neon-magenta border-b border-neon-magenta bg-neon-magenta/5 text-glow-magenta'
                    : 'text-muted-foreground/50 hover:text-foreground/70 hover:bg-secondary/30'
                "
                @click="activeTab = 'receive'"
              >
                $ receive
              </button>
            </div>

            <!-- Tab content — grid overlay keeps both panels in flow so height stays stable -->
            <div class="p-4 sm:p-5 grid">
              <send-panel
                v-show="activeTab === 'send'"
                class="col-start-1 row-start-1"
                :is-send-button-disabled="isSendButtonDisabled"
                @qr-detect="onCameraDetect"
                @handle-file-selection="onFileSelection"
                @handle-send-button="handleSendButton"
                @files-dropped="onFilesDropped"
              />
              <receive-panel
                v-show="activeTab === 'receive'"
                class="col-start-1 row-start-1"
                :client-id="clientId || ''"
                @save-file="saveFile"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
