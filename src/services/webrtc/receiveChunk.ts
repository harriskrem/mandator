import { useDataStore } from '@/store/dataStore'
import { useToastStore } from '@/store/toastStore'
import type { FileDescription } from '@/types/FileDescription'

export default function receiveChunk(
  ev: RTCDataChannelEvent,
  dataChannel: RTCDataChannel,
) {
  let currentFileId: string | null = null

  // Serialize async message handling to ensure OPFS writes complete in order
  let writeQueue = Promise.resolve()

  ev.channel.onmessage = (event) => {
    writeQueue = writeQueue.then(() => handleMessage(event))
  }

  async function handleMessage(event: MessageEvent) {
    const dataStore = useDataStore()
    const toastStore = useToastStore()

    try {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data)
        await handleJsonMessage(data, dataStore, toastStore, dataChannel)
      } else {
        if (currentFileId) {
          await dataStore.setReceivedChunks(event.data)
          sendProgress(dataStore, dataChannel)
        }
      }
    } catch (e) {
      console.error('Error processing message:', e)
    }
  }

  async function handleJsonMessage(
    data: Record<string, unknown>,
    dataStore: ReturnType<typeof useDataStore>,
    toastStore: ReturnType<typeof useToastStore>,
    dc: RTCDataChannel,
  ) {
    switch (data.type) {
      case 'description': {
        const fileDesc = data as unknown as FileDescription
        await dataStore.setFileDescription(fileDesc)
        currentFileId = fileDesc.id
        toastStore.addToast(`Receiving ${fileDesc.filename}`, 'info')
        break
      }
      case 'complete': {
        if (currentFileId === data.id) {
          if (!currentFileId) break
          // Store hash from complete message (streaming protocol)
          if (data.hash) {
            dataStore.setFileHash(currentFileId, data.hash as string)
          }
          await dataStore.finalizeReceive(currentFileId)
          const receivedFile = dataStore?.filesToReceive[currentFileId]
          if (receivedFile) {
            sendProgressMsg(dc, currentFileId, receivedFile.progress)
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
  ) {
    if (!currentFileId) return
    const receivedFile = dataStore.filesToReceive[currentFileId]
    if (receivedFile) {
      sendProgressMsg(dc, currentFileId, receivedFile.progress)
    }
  }

  function sendProgressMsg(
    dc: RTCDataChannel,
    id: string,
    progress: number,
  ) {
    const msg = { type: 'progress', id, progress }
    try {
      dc.send(JSON.stringify(msg))
    } catch {
      // Progress is non-critical — don't let send failures kill the transfer
    }
  }
}
