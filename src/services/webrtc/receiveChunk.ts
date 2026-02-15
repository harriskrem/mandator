import { useDataStore } from '@/store/dataStore'
import { useToastStore } from '@/store/toastStore'
import type { FileDescription } from '@/types/FileDescription'

export default function receiveChunk(
  ev: RTCDataChannelEvent,
  dataChannel: RTCDataChannel,
) {
  let currentFileId: string | null = null

  ev.channel.onmessage = (event) => {
    const dataStore = useDataStore()
    const toastStore = useToastStore()

    if (typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'description': {
            const fileDesc = data as FileDescription
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
                dataChannel.send(
                  JSON.stringify({
                    type: 'progress',
                    id: currentFileId,
                    progress: receivedFile.progress,
                  }),
                )
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
              id: data.id,
              progress: data.progress,
            })
            break
          }
        }
      } catch (e) {
        console.error('Error parsing message:', e)
      }
    } else {
      if (currentFileId) {
        dataStore.setReceivedChunks(event.data)

        const receivedFile = dataStore.filesToReceive[currentFileId]
        if (receivedFile) {
          dataChannel.send(
            JSON.stringify({
              type: 'progress',
              id: currentFileId,
              progress: receivedFile.progress,
            }),
          )
        }
      }
    }
  }
}
