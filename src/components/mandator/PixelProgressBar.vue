<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    progress: number;
    complete?: boolean;
    color?: "cyan" | "magenta" | "amber" | "green";
  }>(),
  {
    complete: false,
    color: "cyan",
  },
);

const colorMap = {
  cyan: {
    filled: "bg-neon-cyan",
    glow: "shadow-[0_0_0.25rem_hsl(187_100%_55%/0.4)]",
  },
  magenta: {
    filled: "bg-neon-magenta",
    glow: "shadow-[0_0_0.25rem_hsl(320_80%_60%/0.4)]",
  },
  amber: {
    filled: "bg-neon-amber",
    glow: "shadow-[0_0_0.25rem_hsl(40_95%_55%/0.4)]",
  },
  green: {
    filled: "bg-neon-green",
    glow: "shadow-[0_0_0.25rem_hsl(150_80%_50%/0.4)]",
  },
};

const totalSegments = 10;
const filledSegments = computed(() =>
  Math.round((props.progress / 100) * totalSegments),
);
const colors = computed(() => colorMap[props.color]);
const segments = computed(() => Array.from({ length: totalSegments }, (_, i) => i));
</script>

<template>
  <span
    v-if="complete"
    class="text-[0.625rem] text-neon-green text-glow-green uppercase tracking-wider"
  >
    [SENT]
  </span>
  <div
    v-else
    class="flex items-center gap-2"
  >
    <div class="flex gap-px">
      <div
        v-for="i in segments"
        :key="i"
        class="w-2 h-3.5 transition-all duration-200"
        :class="
          i < filledSegments
            ? `${colors.filled} ${colors.glow}`
            : 'bg-secondary/60'
        "
      />
    </div>
    <span class="text-[0.625rem] text-muted-foreground tabular-nums w-8 text-right">
      {{ progress }}%
    </span>
  </div>
</template>
