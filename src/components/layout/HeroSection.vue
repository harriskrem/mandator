<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="flex flex-col items-center lg:items-start justify-center text-center lg:text-left py-12 lg:py-0">
    <!-- Terminal prompt prefix -->
    <div class="text-xs text-muted-foreground mb-3 flex items-center gap-2">
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
        <polyline points="4 17 10 11 4 5" />
        <line
          x1="12"
          y1="19"
          x2="20"
          y2="19"
        />
      </svg>
      <span>~/mandator $</span>
      <span class="text-neon-cyan">./init</span>
      <span class="blink-cursor" />
    </div>

    <!-- App title -->
    <h1 class="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-neon-cyan text-glow-cyan uppercase">
      mandator
    </h1>

    <!-- Tagline -->
    <p class="mt-4 text-foreground/70 text-sm leading-relaxed max-w-sm text-balance">
      &gt; Peer-to-peer file transfer. <br>
      <span class="text-neon-cyan/80">No middlemen.</span>
      <span class="text-neon-magenta/80"> No traces.</span>
      <span class="text-neon-amber/80"> Just trust.</span>
    </p>

    <!-- Feature pills -->
    <div class="flex flex-wrap gap-3 mt-6 justify-center lg:justify-start">
      <span class="flex items-center gap-1.5 px-3 py-1.5 border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        </svg>
        [E2E_ENCRYPTED]
      </span>
      <span class="flex items-center gap-1.5 px-3 py-1.5 border border-neon-magenta/20 bg-neon-magenta/5 text-neon-magenta text-xs">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect
            width="18"
            height="11"
            x="3"
            y="11"
            rx="2"
            ry="2"
          />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        [ZERO_KNOWLEDGE]
      </span>
    </div>

    <!-- Animated lock decoration -->
    <div
      class="relative mt-8 animate-float hidden md:block"
      aria-hidden="true"
    >
      <div class="relative flex items-center justify-center">
        <div class="relative">
          <div class="w-24 h-24 border border-neon-cyan/40 bg-card/60 flex items-center justify-center glow-cyan">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-10 h-10 text-neon-cyan/80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect
                width="18"
                height="11"
                x="3"
                y="11"
                rx="2"
                ry="2"
              />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <!-- ASCII data streams -->
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-[0.625rem] text-neon-cyan/40 leading-tight select-none">
            <span class="animate-neon-pulse">0x7F</span>
            <span
              class="animate-neon-pulse"
              style="animation-delay: 0.3s"
            >|</span>
          </div>
          <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-[0.625rem] text-neon-magenta/40 leading-tight select-none">
            <span
              class="animate-neon-pulse"
              style="animation-delay: 0.5s"
            >|</span>
            <span
              class="animate-neon-pulse"
              style="animation-delay: 0.8s"
            >0xAE</span>
          </div>
          <!-- Side indicators -->
          <div
            class="absolute top-1/2 -left-6 -translate-y-1/2 text-[0.625rem] text-neon-amber/40 animate-neon-pulse"
          >
            &lt;&lt;
          </div>
          <div
            class="absolute top-1/2 -right-6 -translate-y-1/2 text-[0.625rem] text-neon-amber/40 animate-neon-pulse"
            style="animation-delay: 1s"
          >
            &gt;&gt;
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom decorative line -->
    <div class="hidden lg:block mt-auto pt-8 w-full">
      <div class="h-px bg-gradient-to-r from-neon-cyan/30 via-neon-magenta/20 to-transparent" />
      <div class="mt-3 flex items-center gap-3 text-[0.625rem] text-muted-foreground/60 uppercase tracking-widest">
        <span>// v0.1.0 | pid:4821 | uptime:03:42:17</span>
        <span class="text-border">|</span>
        <RouterLink
          to="/about"
          class="text-neon-cyan/40 hover:text-neon-cyan transition-colors"
        >
          about
        </RouterLink>
      </div>
    </div>
  </section>
</template>
