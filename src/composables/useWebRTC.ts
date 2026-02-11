import { receiveChunk, sendChunks, sendOffer } from "@/services/webrtc";
import sendCandidate from "@/services/webrtc/sendCandidate";
import { useDataStore } from "@/store/dataStore";
import { usePeerStore } from "@/store/peerStore";
import { useSocketStore } from "@/store/socketStore";
import { computed, onMounted, type ComputedRef } from "vue";
import type { Socket } from "socket.io-client";

export function useWebRTC() {
  const peerStore = usePeerStore();
  const dataStore = useDataStore();
  const socketStore = useSocketStore();

  // WebRTC & socket.io references
  const pc = computed(() => peerStore.pc);
  const remoteId = computed(() => peerStore.remoteId);
  const socket = computed(() => socketStore.getSocket);
  const filesToSend = computed(() => dataStore.filesToSend);

  // Create data channel
  const dataChannel = pc.value.createDataChannel("dataTransfer", {
    ordered: true,
    maxRetransmits: 10,
  });
  dataChannel.binaryType = "arraybuffer";

  // ICE connection state monitoring
  pc.value.addEventListener("iceconnectionstatechange", () => {
    console.log("state: ", pc.value.iceConnectionState);
    if (
      pc.value.iceConnectionState === "connected" ||
      pc.value.iceConnectionState === "completed"
    ) {
      console.log("ICE negotiation successful!");
    }
  });

  // Find and send ICE candidates
  pc.value.addEventListener("icecandidate", (ev) =>
    sendCandidate(ev.candidate, remoteId.value, pc.value, socket.value)
  );

  // Handle incoming data channel and receive chunks
  pc.value.addEventListener("datachannel", (ev) =>
    receiveChunk(ev, dataChannel)
  );

  // Send chunks when channel is connected
  dataChannel.onopen = () => sendChunks(filesToSend.value, pc.value, dataChannel);

  /**
   * Handle send button click
   * Initiates WebRTC offer if connection is new, or sends chunks if already connected
   */
  const handleSend = () => {
    if (pc.value.iceConnectionState === "new") {
      sendOffer(pc.value, socket.value, remoteId);
    } else if (pc.value.iceConnectionState === "connected") {
      if (dataChannel.readyState === "open") {
        sendChunks(filesToSend.value, pc.value, dataChannel);
      }
    }
  };

  return {
    pc,
    remoteId,
    socket,
    filesToSend,
    dataChannel,
    handleSend,
  };
}
