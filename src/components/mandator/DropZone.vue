<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'filesDropped', files: File[]): void
  (e: 'fileSelected', event: Event): void
}>()

const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files.length) {
    emit('filesDropped', Array.from(event.dataTransfer.files))
  }
}

const browseFiles = () => {
  fileInput.value?.click()
}

const onFileChange = (event: Event) => {
  emit('fileSelected', event)
}
</script>

<template>
  <div
    class="relative border-2 border-dashed transition-all duration-300"
    :class="
      isDragging
        ? 'border-neon-cyan bg-neon-cyan/5 glow-cyan-strong'
        : 'border-neon-cyan/20 bg-card/20 hover:border-neon-cyan/40 hover:bg-card/40'
    "
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <!-- Terminal-style title bar -->
    <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 bg-secondary/40">
      <div class="flex gap-1.5">
        <div class="w-2 h-2 rounded-full bg-destructive/50" />
        <div class="w-2 h-2 rounded-full bg-neon-amber/50" />
        <div class="w-2 h-2 rounded-full bg-neon-green/50" />
      </div>
      <span class="text-[0.625rem] text-muted-foreground/60 uppercase tracking-wider">
        ~/mandator/drop-zone
      </span>
    </div>

    <div class="p-6 flex flex-col items-center gap-3">
      <div
        class="w-10 h-10 border flex items-center justify-center transition-all duration-300"
        :class="
          isDragging
            ? 'border-neon-cyan bg-neon-cyan/10 glow-cyan'
            : 'border-border bg-secondary/30'
        "
      >
        <!-- Upload icon -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-4 h-4 transition-colors duration-300"
          :class="isDragging ? 'text-neon-cyan' : 'text-muted-foreground'"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line
            x1="12"
            y1="3"
            x2="12"
            y2="15"
          />
        </svg>
      </div>
      <div class="text-center">
        <p class="text-sm text-foreground/70">
          &gt; drop files here, or
        </p>
      </div>
      <Button
        variant="secondary"
        @click="browseFiles"
      >
        <!-- FolderOpen icon -->
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
          <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" />
        </svg>
        <span>browse files</span>
      </Button>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="onFileChange"
      />
      <p class="text-[0.625rem] text-muted-foreground/50 uppercase tracking-wider">
        // supports any file type
      </p>
    </div>
  </div>
</template>
