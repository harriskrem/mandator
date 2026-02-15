<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'icon' | 'ghost'
type Color = 'cyan' | 'magenta'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    color?: Color
    size?: Size
    glow?: boolean
    disabled?: boolean
    ariaLabel?: string
    fullWidth?: boolean
  }>(),
  {
    variant: 'secondary',
    color: 'cyan',
    size: 'md',
    glow: false,
    disabled: false,
    ariaLabel: undefined,
    fullWidth: false,
  },
)

// Use fully-written class strings so Tailwind can detect them at build time.
// Template-literal interpolation (e.g. `border-neon-${c}`) would be purged.
const variantColorClasses: Record<Variant, Record<Color, string>> = {
  primary: {
    cyan: 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan glow-cyan hover:bg-neon-cyan/20 hover:border-neon-cyan hover:glow-cyan-strong',
    magenta:
      'border-neon-magenta/50 bg-neon-magenta/10 text-neon-magenta glow-magenta hover:bg-neon-magenta/20 hover:border-neon-magenta hover:glow-magenta-strong',
  },
  secondary: {
    cyan: 'border-neon-cyan/30 bg-secondary/30 text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/50',
    magenta:
      'border-neon-magenta/30 bg-secondary/30 text-neon-magenta hover:bg-neon-magenta/10 hover:border-neon-magenta/50',
  },
  icon: {
    cyan: 'border-border bg-secondary/30 text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 hover:bg-neon-cyan/5',
    magenta:
      'border-border bg-secondary/30 text-muted-foreground hover:text-neon-magenta hover:border-neon-magenta/30 hover:bg-neon-magenta/5',
  },
  ghost: {
    cyan: 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-neon-cyan/30',
    magenta:
      'border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-neon-magenta/30',
  },
}

const glowMap: Record<Color, string> = {
  cyan: 'glow-cyan',
  magenta: 'glow-magenta',
}

const sizeClasses = computed(() => {
  if (props.variant === 'icon') {
    const map: Record<Size, string> = {
      sm: 'h-7 w-7',
      md: 'h-9 w-9',
      lg: 'h-11 w-11',
    }
    return map[props.size]
  }

  const map: Record<Size, string> = {
    sm: 'h-7 px-3',
    md: 'h-9 px-4',
    lg: 'h-11 px-6',
  }
  return map[props.size]
})

const buttonClasses = computed(() => {
  const glowClass =
    props.glow && props.variant !== 'primary' ? glowMap[props.color] : ''

  return [
    'border transition-all duration-300',
    'disabled:opacity-30 disabled:pointer-events-none',
    'text-xs uppercase tracking-wider',
    'flex items-center justify-center gap-2',
    variantColorClasses[props.variant][props.color],
    sizeClasses.value,
    glowClass,
    props.fullWidth || (props.size === 'lg' && props.variant !== 'icon')
      ? 'w-full'
      : '',
  ]
    .filter(Boolean)
    .join(' ')
})
</script>

<template>
  <button
    type="button"
    :class="buttonClasses"
    :disabled="disabled"
    :aria-label="ariaLabel"
  >
    <slot />
  </button>
</template>
