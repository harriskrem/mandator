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

  const BUFFERED_AMOUNT_LOW_THRESHOLD = 1024 * 1024 // 1 MB
  const BUFFERED_AMOUNT_HIGH_WATER_MARK = 8 * 1024 * 1024 // 8 MB
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
      await sendFileAtIndex()
      return
    }
    const fileToSend = filesToSend[fileHash]
    if (!fileToSend || fileToSend.sent) {
      currentIndex++
      await sendFileAtIndex()
      return
    }

    try {
      toastStore.addToast(`Sending ${fileToSend.file.name}`, 'info')

      dataChannel.send(JSON.stringify({
        type: 'description',
        id: fileHash,
        filename: fileToSend.file.name,
        size: fileToSend.file.size,
      }))

      dataStore.setSendFileId(fileHash)

      const hasher = await createSHA256()
      const reader = fileToSend.file.stream().getReader()

      // Efficient buffer: collect stream chunks, concat only when ready to send
      let pendingChunks: Uint8Array[] = []
      let pendingSize = 0
      let streamDone = false
      let sentChunks = 0

      const fillBuffer = async (): Promise<Uint8Array> => {
        while (!streamDone && pendingSize < maxMessage) {
          const { done, value } = await reader.read()
          if (done) {
            streamDone = true
            break
          }
          pendingChunks.push(value)
          pendingSize += value.byteLength
        }

        if (pendingSize === 0) {
          return new Uint8Array(0)
        }

        const chunkSize = Math.min(maxMessage, pendingSize)
        const result = new Uint8Array(chunkSize)
        let offset = 0

        while (offset < chunkSize && pendingChunks.length > 0) {
          const piece = pendingChunks[0]!
          const needed = chunkSize - offset
          if (piece.byteLength <= needed) {
            result.set(piece, offset)
            offset += piece.byteLength
            pendingChunks.shift()
            pendingSize -= piece.byteLength
          } else {
            result.set(piece.subarray(0, needed), offset)
            pendingChunks[0] = piece.subarray(needed)
            pendingSize -= needed
            offset += needed
          }
        }

        return result
      }

      // Tight async loop: only yields on backpressure or stream I/O
      while (true) {
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

        const chunk = await fillBuffer()

        if (chunk.byteLength === 0) {
          const hash = hasher.digest('hex')
          dataChannel.send(JSON.stringify({
            type: 'complete',
            id: fileHash,
            totalChunks: sentChunks,
            hash,
          }))

          dataStore.markFileAsSent(fileHash)
          currentIndex++
          await sendFileAtIndex()
          return
        }

        hasher.update(chunk)
        dataChannel.send(chunk.buffer as ArrayBuffer)
        sentChunks++

        if (dataChannel.bufferedAmount > BUFFERED_AMOUNT_HIGH_WATER_MARK) {
          await new Promise<void>((resolve) => {
            dataChannel.addEventListener(
              'bufferedamountlow',
              () => resolve(),
              { once: true },
            )
          })
        }
      }
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
