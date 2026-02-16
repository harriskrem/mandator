import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { PEER_ID_LENGTH, PEER_ID_PATTERN } from '@/config/constants'
import configuration from '@/config/rtcConfig'

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'failed'

export const usePeerStore = defineStore('peer', () => {
  const peerConnection = ref<RTCPeerConnection>(
    new RTCPeerConnection(configuration),
  )
  const selfId = ref<string>('')
  const foreignId = ref<string>('')
  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const connectionError = ref<string | null>(null)
  const dataChannelStatus = ref<'closed' | 'open'>('closed')

  // E2E encryption state (shallowRef to avoid Vue proxy wrapping opaque browser objects)
  const ecdhKeyPair = shallowRef<CryptoKeyPair | null>(null)
  const encryptionKey = shallowRef<CryptoKey | null>(null)
  const peerFingerprint = ref<string>('')
  const selfFingerprint = ref<string>('')
  const isEncrypted = ref<boolean>(false)

  const pc = computed(() => peerConnection.value)
  const remoteId = computed(() => foreignId.value)
  const clientId = computed(() => selfId.value)

  function setClientId(id: string) {
    selfId.value = id
  }

  function setRemoteId(id: string) {
    foreignId.value = id
  }

  function setPeerConnection(pc: RTCPeerConnection) {
    peerConnection.value = pc
  }

  function setConnectionStatus(status: ConnectionStatus) {
    connectionStatus.value = status
    if (status === 'connected') {
      connectionError.value = null
    }
  }

  function setConnectionError(error: string) {
    connectionError.value = error
    connectionStatus.value = 'failed'
  }

  function clearError() {
    connectionError.value = null
  }

  function setDataChannelStatus(status: 'closed' | 'open') {
    dataChannelStatus.value = status
  }

  function setEcdhKeyPair(kp: CryptoKeyPair) {
    ecdhKeyPair.value = kp
  }

  function setEncryptionKey(key: CryptoKey) {
    encryptionKey.value = key
    isEncrypted.value = true
  }

  function setFingerprints(self: string, peer: string) {
    selfFingerprint.value = self
    peerFingerprint.value = peer
  }

  function resetPeerConnection() {
    peerConnection.value.close()
    peerConnection.value = new RTCPeerConnection(configuration)
    connectionStatus.value = 'disconnected'
    connectionError.value = null
    dataChannelStatus.value = 'closed'
    ecdhKeyPair.value = null
    encryptionKey.value = null
    peerFingerprint.value = ''
    selfFingerprint.value = ''
    isEncrypted.value = false
  }

  function isValidPeerId(id: string): boolean {
    return id.length === PEER_ID_LENGTH && PEER_ID_PATTERN.test(id)
  }

  return {
    clientId,
    setClientId,
    remoteId,
    setRemoteId,
    pc,
    setPeerConnection,
    connectionStatus,
    connectionError,
    setConnectionStatus,
    setConnectionError,
    clearError,
    isValidPeerId,
    dataChannelStatus,
    setDataChannelStatus,
    resetPeerConnection,
    ecdhKeyPair,
    encryptionKey,
    peerFingerprint,
    selfFingerprint,
    isEncrypted,
    setEcdhKeyPair,
    setEncryptionKey,
    setFingerprints,
  }
})
