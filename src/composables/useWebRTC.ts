import { computed } from 'vue'
import { sendOffer } from '@/services/webrtc'
import { usePeerStore } from '@/store/peerStore'
import { useSocketStore } from '@/store/socketStore'
import { useToastStore } from '@/store/toastStore'
import { useDataChannel } from './useDataChannel'
import { useFileTransfer } from './useFileTransfer'
import { useIceNegotiation } from './useIceNegotiation'

export function useWebRTC() {
  const peerStore = usePeerStore()
  const socketStore = useSocketStore()
  const toastStore = useToastStore()

  const pc = computed(() => peerStore.pc)
  const remoteId = computed(() => peerStore.remoteId)
  const socket = computed(() => socketStore.getSocket)

  useIceNegotiation()
  const { dataChannel } = useDataChannel()
  const { filesToSend, sendFiles } = useFileTransfer(dataChannel)

  function checkPeer(peerId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const s = socket.value
      if (!s) {
        resolve(false)
        return
      }
      s.emit('check_peer', { peerId }, ({ exists }: { exists: boolean }) => {
        resolve(exists)
      })
    })
  }

  const handleSend = async () => {
    const iceState = pc.value.iceConnectionState

    // Reset stale connections
    if (iceState === 'failed' || iceState === 'closed') {
      peerStore.resetPeerConnection()
    }

    if (pc.value.iceConnectionState === 'new') {
      // Check if peer is online before sending offer
      const peerOnline = await checkPeer(remoteId.value)
      if (!peerOnline) {
        peerStore.setConnectionError('Peer is not online')
        toastStore.addToast('Peer is not online', 'error')
        return
      }
      sendOffer(pc.value, socket.value, remoteId)
    } else if (pc.value.iceConnectionState === 'connected') {
      if (dataChannel.value.readyState === 'open') {
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
