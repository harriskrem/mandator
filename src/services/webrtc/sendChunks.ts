import { createSHA256 } from 'hash-wasm'
import { MAX_CHUNK_SIZE } from '@/config/constants'
import { useDataStore } from '@/store/dataStore'
import { useToastStore } from '@/store/toastStore'
import type { SendFile } from '@/types/SendFile'

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

      // Send description without hash (hash computed incrementally during transfer)
      dataChannel.send(JSON.stringify({
        type: 'description',
        id: fileHash,
        filename: fileToSend.file.name,
        size: fileToSend.file.size,
      }))

      dataStore.setSendFileId(fileHash)

      // Stream the file instead of loading it all into memory
      const hasher = await createSHA256()
      const reader = fileToSend.file.stream().getReader()
      let buffer = new Uint8Array(0)
      let sentChunks = 0
      let streamDone = false

      const fillBuffer = async () => {
        while (!streamDone && buffer.byteLength < maxMessage) {
          const { done, value } = await reader.read()
          if (done) {
            streamDone = true
            break
          }
          const newBuffer = new Uint8Array(buffer.byteLength + value.byteLength)
          newBuffer.set(buffer, 0)
          newBuffer.set(value, buffer.byteLength)
          buffer = newBuffer
        }
      }

      const sendNextChunk = async () => {
        if (dataChannel.readyState !== 'open') {
          reader.cancel()
          dataStore.setTransferError(
            fileHash,
            'Data channel closed during transfer',
          )
          toastStore.addToast('Data channel closed during transfer', 'error')
          dataChannel.removeEventListener('message', progressHandler)
          return
        }

        await fillBuffer()

        if (buffer.byteLength === 0) {
          // All data sent — include hash in complete message
          const hash = hasher.digest('hex')
          dataChannel.send(JSON.stringify({
            type: 'complete',
            id: fileHash,
            totalChunks: sentChunks,
            hash,
          }))

          dataStore.markFileAsSent(fileHash)
          currentIndex++
          sendFileAtIndex()
          return
        }

        // Slice off one chunk
        const chunkSize = Math.min(maxMessage, buffer.byteLength)
        const chunk = buffer.slice(0, chunkSize)
        buffer = buffer.slice(chunkSize)

        hasher.update(chunk)
        dataChannel.send(chunk.buffer)
        sentChunks++

        if (dataChannel.bufferedAmount > BUFFERED_AMOUNT_HIGH_WATER_MARK) {
          dataChannel.addEventListener(
            'bufferedamountlow',
            () => { sendNextChunk() },
            { once: true },
          )
        } else {
          setTimeout(() => { sendNextChunk() }, 0)
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
