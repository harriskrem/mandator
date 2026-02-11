<script setup lang="ts">
import { useDataStore } from "@/store/dataStore";
import { usePeerStore } from "@/store/peerStore";
import saveFile from "@/utils/saveFile";
import { computed, ref, watchEffect } from "vue";
import ReceivePanel from "./components/ReceivePanel.vue";
import SendPanel from "./components/SendPanel.vue";
import { v4 as uuidv4 } from "uuid";
import { useWebRTC } from "@/composables/useWebRTC";

/**
 * TODO:
 * Add feedback connected or disconnected from user
 **/
const peerStore = usePeerStore();
const dataStore = useDataStore();

// Initialize WebRTC composable
const { handleSend } = useWebRTC();

// Reactive references
const clientId = computed(() => peerStore.clientId);
const remoteId = computed(() => peerStore.remoteId);
const filesToSend = computed(() => dataStore.filesToSend);

// Send Tab state
const isSendButtonDisabled = ref<boolean>(true);
const pressedSendButton = ref<boolean>(false);

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

// When pressing send file button
const handleSendButton = () => {
  pressedSendButton.value = true;
  handleSend();
};

watchEffect(() => {
  if (remoteId.value) {
    isSendButtonDisabled.value = false;
  }
});
</script>

<template>
  <div class="sm:hero min-h-screen bg-base-200">
    <div class="sm:hero-content">
      <div class="flex flex-wrap md:flex-nowrap mx-2 sm:mx-10 gap-x-2">
        <article class="prose text-center md:text-left mt-10 sm:mt-0">
          <h1>fides</h1>
          <p>
            Fides is a cutting-edge file transfer app that utilizes WebRTC for
            seamless, peer-to-peer file sharing. Experience fast, secure
            transfers directly between devices without intermediaries, all
            within your browser.
          </p>
        </article>
        <div
          role="tablist"
          class="tabs tabs-lifted"
        >
          <!-- TAB 1 -->
          <input
            type="radio"
            name="my_tabs_1"
            role="tab"
            class="tab"
            aria-label="Send"
            checked
          />
          <div
            role="tabpanel"
            class="tab-content bg-base-100 border-base-300 rounded-box p-6 w-full"
          >
            <send-panel
              :is-send-button-disabled="isSendButtonDisabled"
              @qr-detect="onCameraDetect"
              @handle-file-selection="onFileSelection"
              @handle-send-button="handleSendButton"
            />
          </div>
          <!-- TAB 2 -->
          <input
            type="radio"
            name="my_tabs_1"
            role="tab"
            class="tab"
            aria-label="Receive"
          />
          <div
            role="tabpanel"
            class="tab-content bg-base-100 border-base-300 rounded-box p-6 w-full"
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
</template>
