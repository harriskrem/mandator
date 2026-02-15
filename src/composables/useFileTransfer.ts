import { computed } from 'vue'
import { receiveChunk, sendChunks } from '@/services/webrtc'
import { useDataStore } from '@/store/dataStore'
import { usePeerStore } from '@/store/peerStore'

export function useFileTransfer(dataChannel: RTCDataChannel) {
  const peerStore = usePeerStore()
  const dataStore = useDataStore()

  const pc = computed(() => peerStore.pc)
  const filesToSend = computed(() => dataStore.filesToSend)

  pc.value.addEventListener('datachannel', (ev) =>
    receiveChunk(ev, dataChannel),
  )

  dataChannel.onopen = () =>
    sendChunks(filesToSend.value, pc.value, dataChannel)

  const sendFiles = () => {
    sendChunks(filesToSend.value, pc.value, dataChannel)
  }

  return { filesToSend, sendFiles }
}
