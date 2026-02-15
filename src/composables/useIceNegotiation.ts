import { computed } from 'vue'
import sendCandidate from '@/services/webrtc/sendCandidate'
import { usePeerStore } from '@/store/peerStore'
import { useSocketStore } from '@/store/socketStore'

export function useIceNegotiation() {
  const peerStore = usePeerStore()
  const socketStore = useSocketStore()

  const pc = computed(() => peerStore.pc)
  const remoteId = computed(() => peerStore.remoteId)
  const socket = computed(() => socketStore.getSocket)

  pc.value.addEventListener('icecandidate', (ev) =>
    sendCandidate(ev.candidate, remoteId.value, pc.value, socket.value),
  )

  pc.value.addEventListener('iceconnectionstatechange', () => {
    const state = pc.value.iceConnectionState
    switch (state) {
      case 'checking':
        peerStore.setConnectionStatus('connecting')
        break
      case 'connected':
      case 'completed':
        peerStore.setConnectionStatus('connected')
        break
      case 'failed':
        peerStore.setConnectionError('ICE connection failed')
        break
      case 'disconnected':
        peerStore.setConnectionStatus('disconnected')
        break
      case 'closed':
        peerStore.setConnectionStatus('disconnected')
        break
    }
  })

  return { pc, remoteId, socket }
}
