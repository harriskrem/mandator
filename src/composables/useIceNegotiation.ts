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
    pc.addEventListener('icecandidate', (ev) => {
      if (ev.candidate) {
        console.log(`[ICE] Candidate gathered: type=${ev.candidate.type} protocol=${ev.candidate.protocol} address=${ev.candidate.address}`)
      } else {
        console.log('[ICE] All candidates gathered')
      }
      sendCandidate(ev.candidate, remoteId.value, pc, socket.value)
    })

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
          pc.getStats().then((stats) => {
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                const local = stats.get(report.localCandidateId)
                const remote = stats.get(report.remoteCandidateId)
                console.log(
                  `[ICE] Connection type: local=${local?.candidateType} remote=${remote?.candidateType}` +
                  ` | protocol=${local?.protocol} | ${local?.address}:${local?.port} ↔ ${remote?.address}:${remote?.port}`,
                )
                if (local?.candidateType === 'relay' || remote?.candidateType === 'relay') {
                  peerStore.setConnectionRoute('relay')
                  console.warn('[ICE] ⚠ Data is being relayed through TURN server — expect slower transfers')
                } else {
                  peerStore.setConnectionRoute('direct')
                  console.log('[ICE] ✓ Direct peer-to-peer connection established')
                }
              }
            })
          })
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
