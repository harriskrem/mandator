import { computed, type ShallowRef, watch } from 'vue'
import { receiveChunk, sendChunks } from '@/services/webrtc'
import { useDataStore } from '@/store/dataStore'
import { usePeerStore } from '@/store/peerStore'

export function useFileTransfer(dataChannel: ShallowRef<RTCDataChannel>) {
  const peerStore = usePeerStore()
  const dataStore = useDataStore()

  const filesToSend = computed(() => dataStore.filesToSend)

  function attachReceiveListener(pc: RTCPeerConnection) {
    pc.addEventListener('datachannel', (ev) =>
      receiveChunk(ev, dataChannel.value),
    )
  }

  function attachSendOnOpen(dc: RTCDataChannel) {
    dc.addEventListener('open', () =>
      sendChunks(filesToSend.value, peerStore.pc, dataChannel.value),
    )
  }

  attachReceiveListener(peerStore.pc)
  attachSendOnOpen(dataChannel.value)

  watch(
    () => peerStore.pc,
    (newPc) => {
      attachReceiveListener(newPc)
    },
  )

  watch(dataChannel, (newDc) => {
    attachSendOnOpen(newDc)
  })

  const sendFiles = () => {
    sendChunks(filesToSend.value, peerStore.pc, dataChannel.value)
  }

  return { filesToSend, sendFiles }
}
