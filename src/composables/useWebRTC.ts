import { computed } from 'vue'
import { sendOffer } from '@/services/webrtc'
import { usePeerStore } from '@/store/peerStore'
import { useSocketStore } from '@/store/socketStore'
import { useDataChannel } from './useDataChannel'
import { useFileTransfer } from './useFileTransfer'
import { useIceNegotiation } from './useIceNegotiation'

export function useWebRTC() {
  const peerStore = usePeerStore()
  const socketStore = useSocketStore()

  const pc = computed(() => peerStore.pc)
  const remoteId = computed(() => peerStore.remoteId)
  const socket = computed(() => socketStore.getSocket)

  useIceNegotiation()
  const { dataChannel } = useDataChannel()
  const { filesToSend, sendFiles } = useFileTransfer(dataChannel)

  const handleSend = () => {
    if (pc.value.iceConnectionState === 'new') {
      sendOffer(pc.value, socket.value, remoteId)
    } else if (pc.value.iceConnectionState === 'connected') {
      if (dataChannel.readyState === 'open') {
        sendFiles()
      }
    }
  }

  return {
    pc,
    remoteId,
    socket,
    filesToSend,
    dataChannel,
    handleSend,
  }
}
