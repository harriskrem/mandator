<script setup lang="ts">
import { useToastStore, type ToastType } from '@/store/toastStore'

const toastStore = useToastStore()

const config: Record<
  ToastType,
  { prefix: string; border: string; bg: string; text: string; glow: string; bar: string }
> = {
  success: {
    prefix: '[ok]',
    border: 'border-neon-green/40',
    bg: 'bg-neon-green/5',
    text: 'text-neon-green',
    glow: 'glow-green',
    bar: 'bg-neon-green',
  },
  error: {
    prefix: '[err]',
    border: 'border-destructive/40',
    bg: 'bg-destructive/5',
    text: 'text-destructive',
    glow: 'glow-red',
    bar: 'bg-destructive',
  },
  warning: {
    prefix: '[warn]',
    border: 'border-neon-amber/40',
    bg: 'bg-neon-amber/5',
    text: 'text-neon-amber',
    glow: 'glow-amber',
    bar: 'bg-neon-amber',
  },
  info: {
    prefix: '[info]',
    border: 'border-neon-cyan/40',
    bg: 'bg-neon-cyan/5',
    text: 'text-neon-cyan',
    glow: 'glow-cyan',
    bar: 'bg-neon-cyan',
  },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-2"
      >
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          class="pointer-events-auto border backdrop-blur-sm cursor-pointer overflow-hidden"
          :class="[config[toast.type].border, config[toast.type].bg, config[toast.type].glow]"
          @click="toastStore.removeToast(toast.id)"
        >
          <div class="px-3 py-2.5 flex items-start gap-2">
            <span
              class="text-[0.625rem] shrink-0 mt-0.5 uppercase tracking-wider font-bold"
              :class="config[toast.type].text"
            >
              {{ config[toast.type].prefix }}
            </span>
            <p
              class="text-xs"
              :class="config[toast.type].text"
              style="opacity: 0.85"
            >
              {{ toast.message }}
            </p>
          </div>
          <!-- Progress bar -->
          <div class="h-px w-full bg-border/30">
            <div
              class="h-full toast-progress"
              :class="config[toast.type].bar"
              :style="{ animationDuration: `${toast.duration}ms` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-progress {
  animation: toast-shrink linear forwards;
}

@keyframes toast-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.toast-enter-active {
  transition: all 150ms ease-out;
}

.toast-leave-active {
  transition: all 200ms ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}

.toast-move {
  transition: transform 200ms ease;
}
</style>
