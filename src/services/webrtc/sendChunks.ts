import { MAX_CHUNK_SIZE } from '@/config/constants'
import { useDataStore } from '@/store/dataStore'
import { useToastStore } from '@/store/toastStore'
import type { SendFile } from '@/types/SendFile'
import { computeFileHash } from '@/utils/computeHash'

export default function sendChunks(
  filesToSend: Record<string, SendFile>,
  pc: RTCPeerConnection,
  dataChannel: RTCDataChannel,
) {
  const fileHashes = Object.keys(filesToSend)
  if (!fileHashes.length) return

  const maxMessage = Math.min(
    (pc.sctp as RTCSctpTransport).maxMessageSize,
    MAX_CHUNK_SIZE,
  )

  const BUFFERED_AMOUNT_LOW_THRESHOLD = 256 * 1024 // 256 KB
  const BUFFERED_AMOUNT_HIGH_WATER_MARK = 1024 * 1024 // 1 MB
  dataChannel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD

  const dataStore = useDataStore()
  const toastStore = useToastStore()

  const progressHandler = (event: MessageEvent) => {
    if (typeof event.data !== 'string') return
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'progress' && data.id) {
        dataStore.setDataSentProgress({ id: data.id, progress: data.progress })
      }
    } catch (e) {
      console.error('Error parsing progress message:', e)
    }
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

      dataChannel.send(JSON.stringify({
        type: 'description',
        id: fileHash,
        filename: fileToSend.file.name,
        size: fileToSend.file.size,
        hash,
      }))

      dataStore.setSendFileId(fileHash)

      const fileData = await fileToSend.file.arrayBuffer()
      const totalChunks = Math.ceil(fileData.byteLength / maxMessage)
      let offset = 0

      const sendNextChunk = () => {
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
          dataChannel.send(JSON.stringify({
            type: 'complete',
            id: fileHash,
            totalChunks,
          }))

          dataStore.markFileAsSent(fileHash)
          currentIndex++
          sendFileAtIndex()
          return
        }

        const chunk = fileData.slice(offset, offset + maxMessage)
        dataChannel.send(chunk)
        offset += maxMessage

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
