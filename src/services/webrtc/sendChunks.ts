import { MAX_CHUNK_SIZE } from '@/config/constants'
import {
  encryptChunk,
  decryptChunk,
  packEncryptedMessage,
  unpackEncryptedMessage,
  nextFileCounter,
  ENCRYPTION_OVERHEAD,
  MSG_TYPE_ENCRYPTED_JSON,
  MSG_TYPE_ENCRYPTED_BINARY,
} from '@/crypto/chunkEncryption'
import { useDataStore } from '@/store/dataStore'
import { usePeerStore } from '@/store/peerStore'
import { useToastStore } from '@/store/toastStore'
import type { SendFile } from '@/types/SendFile'
import { computeFileHash } from '@/utils/computeHash'

async function encryptAndSendJSON(
  dataChannel: RTCDataChannel,
  obj: object,
  key: CryptoKey,
  fileId: number,
  chunkIndex: number,
): Promise<void> {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(obj))
  const { iv, ciphertext } = await encryptChunk(jsonBytes.buffer, key, fileId, chunkIndex)
  dataChannel.send(packEncryptedMessage(MSG_TYPE_ENCRYPTED_JSON, iv, ciphertext))
}

export default function sendChunks(
  filesToSend: Record<string, SendFile>,
  pc: RTCPeerConnection,
  dataChannel: RTCDataChannel,
) {
  const fileHashes = Object.keys(filesToSend)
  if (!fileHashes.length) return

  const peerStore = usePeerStore()
  const encryptionKey = peerStore.encryptionKey
  const encrypted = encryptionKey != null

  const maxMessage = Math.min(
    (pc.sctp as RTCSctpTransport).maxMessageSize,
    MAX_CHUNK_SIZE,
  )
  const chunkSize = encrypted ? maxMessage - ENCRYPTION_OVERHEAD : maxMessage

  const BUFFERED_AMOUNT_LOW_THRESHOLD = 256 * 1024 // 256 KB
  const BUFFERED_AMOUNT_HIGH_WATER_MARK = 1024 * 1024 // 1 MB
  dataChannel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD

  const dataStore = useDataStore()
  const toastStore = useToastStore()

  const progressHandler = (event: MessageEvent) => {
    // Progress messages come back encrypted when encryption is active
    const parseProgress = async (raw: MessageEvent['data']) => {
      let jsonStr: string
      if (encrypted && raw instanceof ArrayBuffer) {
        const { iv, ciphertext } = unpackEncryptedMessage(raw)
        const plain = await decryptChunk(iv, ciphertext, encryptionKey)
        jsonStr = new TextDecoder().decode(plain)
      } else if (typeof raw === 'string') {
        jsonStr = raw
      } else {
        return
      }
      const data = JSON.parse(jsonStr)
      if (data.type === 'progress' && data.id) {
        dataStore.setDataSentProgress({ id: data.id, progress: data.progress })
      }
    }
    parseProgress(event.data).catch((e) =>
      console.error('Error parsing progress message:', e),
    )
  }

  dataChannel.addEventListener('message', progressHandler)

  let currentIndex = 0

  const sendFileAtIndex = async () => {
    if (currentIndex >= fileHashes.length) {
      dataChannel.removeEventListener('message', progressHandler)
      dataStore.setSendComplete(true)
      toastStore.addToast('Transfer complete', 'success')
      return
    }

    const fileHash = fileHashes[currentIndex]
    if (!fileHash) {
      currentIndex++
      sendFileAtIndex()
      return
    }
    const fileToSend = filesToSend[fileHash]
    if (!fileToSend || fileToSend.sent) {
      currentIndex++
      sendFileAtIndex()
      return
    }

    try {
      toastStore.addToast(`Sending ${fileToSend.file.name}`, 'info')
      const hash = await computeFileHash(fileToSend.file)
      const fileId = encrypted ? nextFileCounter() : 0

      const descMsg = {
        type: 'description',
        id: fileHash,
        filename: fileToSend.file.name,
        size: fileToSend.file.size,
        hash,
      }

      if (encrypted) {
        await encryptAndSendJSON(dataChannel, descMsg, encryptionKey, fileId, 0)
      } else {
        dataChannel.send(JSON.stringify(descMsg))
      }

      dataStore.setSendFileId(fileHash)

      const fileData = await fileToSend.file.arrayBuffer()
      const totalChunks = Math.ceil(fileData.byteLength / chunkSize)
      let offset = 0
      // chunkIndex starts at 1 because 0 was used for description
      let chunkIndex = 1

      const sendNextChunk = async () => {
        if (dataChannel.readyState !== 'open') {
          dataStore.setTransferError(
            fileHash,
            'Data channel closed during transfer',
          )
          toastStore.addToast('Data channel closed during transfer', 'error')
          dataChannel.removeEventListener('message', progressHandler)
          return
        }

        if (offset >= fileData.byteLength) {
          const completeMsg = {
            type: 'complete',
            id: fileHash,
            totalChunks,
          }

          if (encrypted) {
            await encryptAndSendJSON(dataChannel, completeMsg, encryptionKey, fileId, chunkIndex)
          } else {
            dataChannel.send(JSON.stringify(completeMsg))
          }

          dataStore.markFileAsSent(fileHash)
          currentIndex++
          sendFileAtIndex()
          return
        }

        const chunk = fileData.slice(offset, offset + chunkSize)

        if (encrypted) {
          const { iv, ciphertext } = await encryptChunk(chunk, encryptionKey, fileId, chunkIndex)
          dataChannel.send(packEncryptedMessage(MSG_TYPE_ENCRYPTED_BINARY, iv, ciphertext))
        } else {
          dataChannel.send(chunk)
        }

        offset += chunkSize
        chunkIndex++

        if (dataChannel.bufferedAmount > BUFFERED_AMOUNT_HIGH_WATER_MARK) {
          dataChannel.addEventListener('bufferedamountlow', () => sendNextChunk(), { once: true })
        } else {
          setTimeout(sendNextChunk, 0)
        }
      }

      sendNextChunk()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error sending file'
      dataStore.setTransferError(fileHash, message)
      toastStore.addToast(`Transfer error: ${message}`, 'error')
      console.error('Error sending file:', error)
    }
  }

  sendFileAtIndex()
}
