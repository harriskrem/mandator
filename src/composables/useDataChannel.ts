import { computed } from 'vue'
import { DATA_CHANNEL_CONFIG, DATA_CHANNEL_LABEL } from '@/config/constants'
import { usePeerStore } from '@/store/peerStore'

export function useDataChannel() {
  const peerStore = usePeerStore()
  const pc = computed(() => peerStore.pc)

  const dataChannel = pc.value.createDataChannel(
    DATA_CHANNEL_LABEL,
    DATA_CHANNEL_CONFIG,
  )
  dataChannel.binaryType = 'arraybuffer'

  dataChannel.onopen = () => console.log('[useDataChannel] dataChannel OPEN')
  dataChannel.onclose = () => console.log('[useDataChannel] dataChannel CLOSED')
  dataChannel.onerror = (e) => console.error('[useDataChannel] dataChannel ERROR:', e)

  return { dataChannel }
}
