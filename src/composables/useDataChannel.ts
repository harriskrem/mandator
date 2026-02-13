import { DATA_CHANNEL_CONFIG, DATA_CHANNEL_LABEL } from "@/config/constants";
import { computed } from "vue";
import { usePeerStore } from "@/store/peerStore";

export function useDataChannel() {
  const peerStore = usePeerStore();
  const pc = computed(() => peerStore.pc);

  const dataChannel = pc.value.createDataChannel(
    DATA_CHANNEL_LABEL,
    DATA_CHANNEL_CONFIG,
  );
  dataChannel.binaryType = "arraybuffer";

  return { dataChannel };
}
