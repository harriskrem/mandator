import configuration from "@/config/rtcConfig";
import { PEER_ID_LENGTH, PEER_ID_PATTERN } from "@/config/constants";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "failed";

export const usePeerStore = defineStore('peer', () => {
  const peerConnection = ref<RTCPeerConnection>(new RTCPeerConnection(configuration));
  const selfId = ref<string>("");
  const foreignId = ref<string>("");
  const connectionStatus = ref<ConnectionStatus>("disconnected");
  const connectionError = ref<string | null>(null);

  const pc = computed(() => peerConnection.value);
  const remoteId = computed(() => foreignId.value);
  const clientId = computed(() => selfId.value);

  function setClientId(id: string) {
    selfId.value = id;
  }

  function setRemoteId(id: string) {
    foreignId.value = id;
  }

  function setPeerConnection(pc: RTCPeerConnection) {
    peerConnection.value = pc;
  }

  function setConnectionStatus(status: ConnectionStatus) {
    connectionStatus.value = status;
    if (status === "connected") {
      connectionError.value = null;
    }
  }

  function setConnectionError(error: string) {
    connectionError.value = error;
    connectionStatus.value = "failed";
  }

  function clearError() {
    connectionError.value = null;
  }

  function isValidPeerId(id: string): boolean {
    return id.length === PEER_ID_LENGTH && PEER_ID_PATTERN.test(id);
  }

  return {
    clientId,
    setClientId,
    remoteId,
    setRemoteId,
    pc,
    setPeerConnection,
    connectionStatus,
    connectionError,
    setConnectionStatus,
    setConnectionError,
    clearError,
    isValidPeerId,
  }
})
