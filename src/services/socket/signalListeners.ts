import type { Socket } from 'socket.io-client'
import { computed } from 'vue'
import { usePeerStore } from '@/store/peerStore'
import {
  handleConnectionOffer,
  handleReceivedCandidate,
  processAnswer,
} from '../webrtc'

export default function setupSocketListeners(socket: Socket | null) {
  // socket.io listeners
  const peerStore = usePeerStore()
  const pc = computed(() => peerStore.pc)
  const remoteId = computed(() => peerStore.remoteId)

  if (socket) {
    socket.on('connect', () => {
      // when connected assign the id to the app
      peerStore.setClientId(socket.id ?? '')
    })

    socket.on(
      'get_connection_offer',
      ({
        offer,
        peerId,
      }: {
        offer: RTCSessionDescriptionInit
        peerId: string
      }) => {
        remoteId.value === '' && peerStore.setRemoteId(peerId)
        handleConnectionOffer({ pc: pc.value, offer, socket, peerId })
      },
    )

    socket.on(
      'get_answer',
      ({ answer }: { answer: RTCSessionDescriptionInit }) => {
        processAnswer(pc.value, answer)
      },
    )

    socket.on(
      'get_candidate',
      ({ candidate }: { candidate: RTCIceCandidate }) => {
        handleReceivedCandidate(pc.value, candidate)
      },
    )

    socket.on('get_id', ({ peerId }: { peerId: string }) => {
      peerStore.setRemoteId(peerId)
    })
  }
}
