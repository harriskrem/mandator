<script setup lang="ts">
import { ScanQrIcon } from "@/assets/icons";
import ModalScanQr from "@/components/modal/ScanQr.vue";
import { useDataStore } from "@/store/dataStore";
import { usePeerStore } from "@/store/peerStore";
import { computed, ref, toRefs } from "vue";

const props = defineProps<{
  isSendButtonDisabled: boolean;
  onQrDetect: (a: any[]) => void;
  onHandleSendButton: () => void;
  onHandleFileSelection: (a: Event) => void;
}>();
const { isSendButtonDisabled } = toRefs(props);

const emit = defineEmits<{
  (e: "handleSendButton"): void;
  (e: "qrDetect", a: any[]): void;
  (e: "handleFileSelection", a: Event): void;
}>();

const dataStore = useDataStore();
const filesToSend = computed(() => dataStore.filesToSend);
const peer = usePeerStore();
const remoteId = computed({
  get: () => peer.remoteId,
  set: (value: string) => peer.setRemoteId(value),
});

const scanQr = ref(false);
const toggleScan = () => (scanQr.value = !scanQr.value);

const handleOnQrDetect = (detectedCodes: any[]) => {
  if (detectedCodes[0].rawValue) {
    scanQr.value = false;
    emit("qrDetect", detectedCodes);
  }
};
</script>

<template>
  <modal-scan-qr
    v-model:show-modal="scanQr"
    :scan-qr="true"
    @camera-detect="handleOnQrDetect"
  />
  <div>
    <p class="leading-loose text-md">Send any type of file at any size</p>
  </div>
  <div class="my-2">
    <label class="input input-bordered flex items-center gap-2">
      <input
        v-model="remoteId"
        type="text"
        class="grow"
        placeholder="Type other peer's code"
      />
      <button
        class="btn btn-ghost btn-circle btn-sm"
        @click="toggleScan"
      >
        <scan-qr-icon />
      </button>
    </label>
  </div>
  <div class="my-2">
    <input
      id="file"
      class="file-input file-input-primary file-input-bordered w-full"
      type="file"
      @change="$emit('handleFileSelection', $event)"
    />
  </div>
  <div
    v-if="Object.keys(filesToSend).length"
    class="my-2 mockup-window border bg-base-300"
  >
    <table class="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Size</th>
          <th>Progress</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(sendingFile, index) in filesToSend"
          :key="index"
        >
          <th>{{ sendingFile.file.name }}</th>
          <th>{{ sendingFile.file.size }}</th>
          <th class="sm:w-36">
            <div class="flex justify-center">
              <span
                v-if="
                  sendingFile.progress > 0 &&
                  sendingFile.progress === sendingFile?.file?.size
                "
              >
                Sent!
              </span>
              <progress
                v-else
                class="progress sm:w-36"
                :value="sendingFile.progress"
                :max="sendingFile.file.size"
              />
            </div>
          </th>
        </tr>
      </tbody>
    </table>
  </div>
  <button
    :disabled="isSendButtonDisabled"
    class="btn btn-block btn-primary"
    @click="$emit('handleSendButton')"
  >
    Send File
  </button>
</template>
