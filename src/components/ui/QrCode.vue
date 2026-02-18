<script setup lang="ts">
import type { Level, RenderAs } from 'qrcode.vue'
import QrcodeVue from 'qrcode.vue'
import { ref } from 'vue'

const { qrValue } = defineProps<{
  qrValue: string
}>()
const level = ref<Level>('M')
const renderAs = ref<RenderAs>('svg')
</script>

<template>
  <qrcode-vue
    :value="qrValue"
    :level="level"
    :render-as="renderAs"
  />
</template>
