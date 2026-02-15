import { computed, watch } from 'vue'
import sendCandidate from '@/services/webrtc/sendCandidate'
import { usePeerStore } from '@/store/peerStore'
import { useSocketStore } from '@/store/socketStore'
import { useToastStore } from '@/store/toastStore'

export function useIceNegotiation() {
  const peerStore = usePeerStore()
  const socketStore = useSocketStore()
  const toastStore = useToastStore()

  const remoteId = computed(() => peerStore.remoteId)
  const socket = computed(() => socketStore.getSocket)

  function attachListeners(pc: RTCPeerConnection) {
    pc.addEventListener('icecandidate', (ev) =>
      sendCandidate(ev.candidate, remoteId.value, pc, socket.value),
    )

    pc.addEventListener('iceconnectionstatechange', () => {
      const state = pc.iceConnectionState
      switch (state) {
        case 'checking':
          peerStore.setConnectionStatus('connecting')
          break
        case 'connected':
        case 'completed':
          peerStore.setConnectionStatus('connected')
          toastStore.addToast('Peer connected', 'success')
          break
        case 'failed':
          peerStore.setConnectionError('ICE connection failed')
          toastStore.addToast('ICE connection failed', 'error')
          break
        case 'disconnected':
          peerStore.setConnectionStatus('disconnected')
          toastStore.addToast('Peer disconnected', 'warning')
          break
        case 'closed':
          peerStore.setConnectionStatus('disconnected')
          break
      }
    })
  }

  attachListeners(peerStore.pc)

  watch(
    () => peerStore.pc,
    (newPc) => {
      attachListeners(newPc)
    },
  )

  return { remoteId, socket }
}
