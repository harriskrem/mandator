import {
  decryptChunk,
  unpackEncryptedMessage,
  encryptChunk,
  packEncryptedMessage,
  MSG_TYPE_ENCRYPTED_JSON,
  MSG_TYPE_ENCRYPTED_BINARY,
} from '@/crypto/chunkEncryption'
import { useDataStore } from '@/store/dataStore'
import { usePeerStore } from '@/store/peerStore'
import { useToastStore } from '@/store/toastStore'
import type { FileDescription } from '@/types/FileDescription'

let progressChunkCounter = 0

async function encryptAndSendJSON(
  dataChannel: RTCDataChannel,
  obj: object,
  key: CryptoKey,
): Promise<void> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(obj))
  const { iv, ciphertext } = await encryptChunk(jsonBytes.buffer, key, 0xffff, progressChunkCounter++)
  dataChannel.send(packEncryptedMessage(MSG_TYPE_ENCRYPTED_JSON, iv, ciphertext))
}

export default function receiveChunk(
  ev: RTCDataChannelEvent,
  dataChannel: RTCDataChannel,
) {
  let currentFileId: string | null = null
  let progressSendPending = false
  let lastProgressFileId: string | null = null
  let lastProgressValue = 0
  progressChunkCounter = 0

  const peerStore = usePeerStore()
  const encryptionKey = peerStore.encryptionKey
  const encrypted = encryptionKey != null

  ev.channel.onmessage = async (event) => {
    const dataStore = useDataStore()
    const toastStore = useToastStore()

    try {
      if (encrypted && event.data instanceof ArrayBuffer) {
        const { typeFlag, iv, ciphertext } = unpackEncryptedMessage(event.data)
        const plaintext = await decryptChunk(iv, ciphertext, encryptionKey)

        if (typeFlag === MSG_TYPE_ENCRYPTED_JSON) {
          const jsonStr = new TextDecoder().decode(plaintext)
          const data = JSON.parse(jsonStr)
          handleJsonMessage(data, dataStore, toastStore, dataChannel, encryptionKey)
        } else if (typeFlag === MSG_TYPE_ENCRYPTED_BINARY) {
          if (currentFileId) {
            dataStore.setReceivedChunks(new Blob([plaintext]))
            throttledSendProgress(dataStore, dataChannel, encryptionKey)
          }
        }
      } else if (typeof event.data === 'string') {
        // Unencrypted fallback
        const data = JSON.parse(event.data)
        handleJsonMessage(data, dataStore, toastStore, dataChannel, null)
      } else {
        // Unencrypted binary
        if (currentFileId) {
          dataStore.setReceivedChunks(event.data)
          sendProgress(dataStore, dataChannel, null)
        }
      }
    } catch (e) {
      console.error('Error processing message:', e)
    }
  }

  // Throttle encrypted progress sends to avoid overwhelming the data channel
  // with async encrypt+send operations that pile up faster than they drain
  function throttledSendProgress(
    dataStore: ReturnType<typeof useDataStore>,
    dc: RTCDataChannel,
    key: CryptoKey | null,
  ) {
    if (!currentFileId) return
    const receivedFile = dataStore.filesToReceive[currentFileId]
    if (!receivedFile) return

    lastProgressFileId = currentFileId
    lastProgressValue = receivedFile.progress

    if (progressSendPending) return
    progressSendPending = true

    setTimeout(() => {
      progressSendPending = false
      if (lastProgressFileId) {
        sendProgressMsg(dc, key, lastProgressFileId, lastProgressValue)
      }
    }, 100)
  }

  function handleJsonMessage(
    data: Record<string, unknown>,
    dataStore: ReturnType<typeof useDataStore>,
    toastStore: ReturnType<typeof useToastStore>,
    dc: RTCDataChannel,
    key: CryptoKey | null,
  ) {
    switch (data.type) {
      case 'description': {
        const fileDesc = data as unknown as FileDescription
        dataStore.setFileDescription(fileDesc)
        currentFileId = fileDesc.id
        toastStore.addToast(`Receiving ${fileDesc.filename}`, 'info')
        break
      }
      case 'complete': {
        if (currentFileId === data.id) {
          if (!currentFileId) break
          const receivedFile = dataStore?.filesToReceive[currentFileId]
          if (receivedFile) {
            sendProgressMsg(dc, key, currentFileId, receivedFile.progress)
            toastStore.addToast(`${receivedFile.filename} received`, 'success')
            dataStore.verifyFileIntegrity(currentFileId).then((result) => {
              if (result === true) {
                toastStore.addToast('SHA256 verified', 'success')
              } else if (result === false) {
                toastStore.addToast('SHA256 mismatch — file may be corrupted', 'error')
              }
            })
          }
          currentFileId = null
        }
        break
      }
      case 'progress': {
        dataStore.setDataSentProgress({
          id: data.id as string,
          progress: data.progress as number,
        })
        break
      }
    }
  }

  function sendProgress(
    dataStore: ReturnType<typeof useDataStore>,
    dc: RTCDataChannel,
    key: CryptoKey | null,
  ) {
    if (!currentFileId) return
    const receivedFile = dataStore.filesToReceive[currentFileId]
    if (receivedFile) {
      sendProgressMsg(dc, key, currentFileId, receivedFile.progress)
    }
  }

  function sendProgressMsg(
    dc: RTCDataChannel,
    key: CryptoKey | null,
    id: string,
    progress: number,
  ) {
    const msg = { type: 'progress', id, progress }
    try {
      if (key) {
        encryptAndSendJSON(dc, msg, key).catch(() => {})
      } else {
        dc.send(JSON.stringify(msg))
      }
    } catch {
      // Progress is non-critical — don't let send failures kill the transfer
    }
  }
}
