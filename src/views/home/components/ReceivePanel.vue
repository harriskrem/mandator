<script setup lang="ts">
import { CopyIcon, CopySuccessIcon, ScanQrIcon } from "@/assets/icons";
import ModalScanQr from "@/components/modal/ScanQr.vue";
import { useDataStore } from "@/store/dataStore";
import { computed, ref, toRefs, onMounted, watch } from "vue";

const props = defineProps<{
  clientId: string;
  onSaveFile: (a: string) => void;
}>();
const { clientId } = toRefs(props);

defineEmits<{
  (a: "saveFile", b: string): void;
}>();
const dataStore = useDataStore();
const incomingFiles = computed(() => dataStore.filesToReceive);
const checkedURL = ref<boolean>(false);
const userClicked = ref<boolean>(false);
const showQrModal = ref<boolean>(false);

const toggleQrModal = () => (showQrModal.value = !showQrModal.value);

const copyToClipboard = () => {
  if (checkedURL.value) {
    navigator.clipboard.writeText(`https://tobefilled.tech/${clientId.value}`);
  } else {
    navigator.clipboard.writeText(clientId.value);
  }
  userClicked.value = true;
  setTimeout(() => (userClicked.value = false), 3000);
};

const getShareCodeForReceive = () => {
  const shareCode = checkedURL.value
    ? `https://tobefilled.tech/${clientId.value}`
    : clientId.value;
  console.log("📋 ReceiveTab: getShareCodeForReceive returning:", shareCode);
  return shareCode;
};
</script>

<template>
  <modal-scan-qr
    v-model:show-modal="showQrModal"
    :self-code="clientId"
  />
  <div>
    <p class="leading-loose text-md">Receive files</p>
  </div>
  <div
    v-if="!clientId"
    class="my-2"
  >
    <div class="alert alert-info">
      <span>🔄 Connecting to server...</span>
    </div>
  </div>
  <div
    v-else
    class="my-2"
  >
    <div class="label pb-0">
      <span
        v-if="checkedURL"
        class="label-text"
      >
        Your share URL is:
      </span>
      <span
        v-else
        class="label-text"
      >
        Your share code is:
      </span>
      <div class="form-control">
        <label class="label cursor-pointer">
          <span class="label-text">URL</span>
          <input
            v-model="checkedURL"
            type="checkbox"
            class="toggle toggle-primary ml-3"
          />
        </label>
      </div>
    </div>
    <label class="input input-bordered flex items-center gap-2">
      <input
        type="text"
        class="grow disabled disabled:opacity-60"
        :placeholder="getShareCodeForReceive()"
        disabled
      />
      <button
        id="scanQr"
        class="btn btn-ghost btn-circle btn-sm"
        @click="toggleQrModal"
      >
        <scan-qr-icon />
      </button>
      <button
        id="copyClipboard"
        class="btn btn-ghost btn-circle btn-sm"
        @click="copyToClipboard"
      >
        <copy-success-icon v-if="userClicked" />
        <copy-icon v-else />
      </button>
    </label>
  </div>
  <div
    v-if="Object.keys(incomingFiles).length > 0"
    class="mockup-window border bg-base-300"
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
          v-for="(receivingFile, fileHash) in incomingFiles"
          :key="fileHash"
        >
          <th>{{ receivingFile.filename }}</th>
          <th>{{ receivingFile.size }}</th>
          <th class="sm:w-36">
            <div class="flex justify-center">
              <button
                v-if="
                  receivingFile.progress > 0 &&
                  receivingFile.progress === receivingFile.size
                "
                class="btn btn-sm btn-secondary"
                @click="$emit('saveFile', fileHash)"
              >
                Download
              </button>
              <progress
                v-else
                class="progress sm:w-36"
                :value="receivingFile.progress"
                :max="receivingFile.size"
              />
            </div>
          </th>
        </tr>
      </tbody>
    </table>
  </div>
</template>
