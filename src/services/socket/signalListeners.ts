import type { Socket } from 'socket.io-client'
import { computed } from 'vue'
import { usePeerStore } from '@/store/peerStore'
import { useToastStore } from '@/store/toastStore'
import { deriveEncryptionKey, computeFingerprint } from '@/crypto/keyExchange'
import {
  handleConnectionOffer,
  handleReceivedCandidate,
  processAnswer,
} from '../webrtc'

export default function setupSocketListeners(socket: Socket | null) {
  // socket.io listeners
  const peerStore = usePeerStore()
  const toastStore = useToastStore()
  const pc = computed(() => peerStore.pc)
  const remoteId = computed(() => peerStore.remoteId)

  if (socket) {
    socket.on('connect', () => {
      peerStore.setClientId(socket.id ?? '')
      toastStore.addToast('Signal server connected', 'info')
    })

    socket.on('disconnect', (reason) => {
      toastStore.addToast('Signal server disconnected', 'warning')
    })

    socket.on('connect_error', (err) => {
      toastStore.addToast('Signal server connection failed', 'error')
    })

    socket.on(
      'get_connection_offer',
      ({
        offer,
        peerId,
        ecdhPublicKey,
      }: {
        offer: RTCSessionDescriptionInit
        peerId: string
        ecdhPublicKey?: JsonWebKey
      }) => {
        remoteId.value === '' && peerStore.setRemoteId(peerId)
        handleConnectionOffer({ pc: pc.value, offer, socket, peerId, ecdhPublicKey })
      },
    )

    socket.on(
      'get_answer',
      async ({
        answer,
        ecdhPublicKey,
      }: {
        answer: RTCSessionDescriptionInit
        ecdhPublicKey?: JsonWebKey
      }) => {
        processAnswer(pc.value, answer)

        // Derive encryption key from the answerer's public key
        if (ecdhPublicKey && peerStore.ecdhKeyPair) {
          const encKey = await deriveEncryptionKey(
            peerStore.ecdhKeyPair.privateKey,
            ecdhPublicKey,
          )
          peerStore.setEncryptionKey(encKey)

          const peerFp = await computeFingerprint(ecdhPublicKey)
          peerStore.setFingerprints(peerStore.selfFingerprint, peerFp)
        }
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

    socket.on('peer_disconnected', ({ peerId }: { peerId: string }) => {
      if (peerId === peerStore.remoteId) {
        peerStore.resetPeerConnection()
        toastStore.addToast('Peer disconnected', 'warning')
      }
    })
  }
}
