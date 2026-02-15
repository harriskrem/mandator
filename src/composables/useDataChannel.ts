import { shallowRef, watch } from 'vue'
import { DATA_CHANNEL_CONFIG, DATA_CHANNEL_LABEL } from '@/config/constants'
import { usePeerStore } from '@/store/peerStore'

export function useDataChannel() {
  const peerStore = usePeerStore()

  function createChannel(pc: RTCPeerConnection) {
    const dc = pc.createDataChannel(DATA_CHANNEL_LABEL, DATA_CHANNEL_CONFIG)
    dc.binaryType = 'arraybuffer'
    dc.addEventListener('open', () => peerStore.setDataChannelStatus('open'))
    dc.addEventListener('close', () => peerStore.setDataChannelStatus('closed'))
    dc.addEventListener('error', () => peerStore.setDataChannelStatus('closed'))
    return dc
  }

  const dataChannel = shallowRef(createChannel(peerStore.pc))

  watch(
    () => peerStore.pc,
    (newPc) => {
      dataChannel.value = createChannel(newPc)
    },
  )

  return { dataChannel }
}
