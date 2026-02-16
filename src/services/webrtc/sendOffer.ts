import type { Socket } from 'socket.io-client'
import type { Ref } from 'vue'
import { generateKeyPair, exportPublicKey, computeFingerprint } from '@/crypto/keyExchange'
import { usePeerStore } from '@/store/peerStore'

export default async function sendOffer(
  pc: RTCPeerConnection,
  socket: Socket,
  foreign_code: Ref<string>,
) {
  const peerStore = usePeerStore()

  // Generate ephemeral ECDH keypair
  const keyPair = await generateKeyPair()
  peerStore.setEcdhKeyPair(keyPair)

  const publicKeyJwk = await exportPublicKey(keyPair.publicKey)
  const selfFp = await computeFingerprint(publicKeyJwk)
  peerStore.setFingerprints(selfFp, '')

  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  socket.emit('send_connection_offer', {
    offer: offer,
    peerId: foreign_code.value,
    ecdhPublicKey: publicKeyJwk,
  })
}
