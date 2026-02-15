<script setup lang="ts">
import TerminalTitleBar from '@/components/mandator/TerminalTitleBar.vue'
import QrCode from '@/components/QrCode.vue'
import Button from '@/components/ui/Button.vue'

const { selfCode, scanQr } = defineProps<{
  scanQr?: boolean
  selfCode?: string
}>()

const showModal = defineModel('showModal', {
  type: Boolean,
  required: true,
})

defineEmits<(e: 'cameraDetect', a: { rawValue: string }[]) => void>()

const handleClose = () => (showModal.value = false)
</script>

<template>
  <div v-if="showModal">
    <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-background/85 backdrop-blur-sm"
        @click="handleClose"
        aria-hidden="true"
      />

      <!-- Modal card -->
      <div class="relative w-full max-w-sm border border-neon-cyan/20 bg-card p-6 glow-cyan text-center">
        <!-- Terminal title bar -->
        <div class="absolute top-0 left-0 right-0">
          <terminal-title-bar
            :title="scanQr ? '~/mandator/qr-scan' : '~/mandator/qr-share'"
          />
        </div>

        <div class="mt-6">
          <h2 class="text-xs text-neon-cyan text-glow-cyan uppercase tracking-wider mb-6">
            {{ scanQr ? "> scan with camera" : "> share your code" }}
          </h2>

          <div class="flex justify-center my-4">
            <QrCode
              v-if="selfCode"
              :qr-value="selfCode"
            />
            <qrcode-stream
              v-else
              @detect="$emit('cameraDetect', $event)"
            />
          </div>

          <Button
            variant="ghost"
            full-width
            class="mt-6"
            @click="handleClose"
          >
            <!-- X icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
            close
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
