<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-secondary/40">
    <div class="flex gap-1.5">
      <div class="w-2 h-2 rounded-full bg-destructive/50" />
      <div class="w-2 h-2 rounded-full bg-neon-amber/50" />
      <div class="w-2 h-2 rounded-full bg-neon-green/50" />
    </div>
    <span class="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
      {{ title }}
    </span>
  </div>
</template>
