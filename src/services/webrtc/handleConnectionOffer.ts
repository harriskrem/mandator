import type { Socket } from 'socket.io-client'
import { generateKeyPair, exportPublicKey, deriveEncryptionKey, computeFingerprint } from '@/crypto/keyExchange'
import { usePeerStore } from '@/store/peerStore'

type HandleConnectionOffer = {
  pc: RTCPeerConnection
  offer: RTCSessionDescriptionInit
  socket: Socket
  peerId: string
  ecdhPublicKey?: JsonWebKey
}

export default async function handleConnectionOffer(
  props: HandleConnectionOffer,
) {
  const { pc, offer, socket, peerId, ecdhPublicKey } = props
  const peerStore = usePeerStore()

  await pc.setRemoteDescription(offer)
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)

  let ownPublicKeyJwk: JsonWebKey | undefined

  if (ecdhPublicKey) {
    // Generate own ECDH keypair
    const keyPair = await generateKeyPair()
    peerStore.setEcdhKeyPair(keyPair)

    ownPublicKeyJwk = await exportPublicKey(keyPair.publicKey)

    // Derive shared encryption key
    const encKey = await deriveEncryptionKey(keyPair.privateKey, ecdhPublicKey)
    peerStore.setEncryptionKey(encKey)

    // Compute and store fingerprints
    const selfFp = await computeFingerprint(ownPublicKeyJwk)
    const peerFp = await computeFingerprint(ecdhPublicKey)
    peerStore.setFingerprints(selfFp, peerFp)
  }

  socket.emit('answer', {
    answer: answer,
    peerId: peerId,
    ...(ownPublicKeyJwk && { ecdhPublicKey: ownPublicKeyJwk }),
  })
}
