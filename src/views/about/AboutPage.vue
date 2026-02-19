<script setup lang="ts">
import { RouterLink } from 'vue-router'
import TerminalTitleBar from '@/components/ui/TerminalTitleBar.vue'
</script>

<template>
  <main class="relative h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
    <!-- Ambient glow blobs -->
    <div
      class="fixed top-0 left-1/4 w-[31.25rem] h-[31.25rem] rounded-full opacity-[0.04] blur-[7.5rem] pointer-events-none"
      style="background: hsl(187, 100%, 55%)"
      aria-hidden="true"
    />
    <div
      class="fixed bottom-0 right-1/4 w-[25rem] h-[25rem] rounded-full opacity-[0.03] blur-[6.25rem] pointer-events-none"
      style="background: hsl(320, 80%, 60%)"
      aria-hidden="true"
    />

    <div class="w-full max-w-3xl mx-auto max-h-full flex flex-col">
      <div class="border border-border bg-card/40 backdrop-blur-sm overflow-hidden glow-cyan flex flex-col max-h-full">
        <terminal-title-bar title="~/mandator/about" />

        <div class="p-5 sm:p-8 space-y-8 overflow-y-auto">
          <!-- Back link -->
          <RouterLink
            to="/"
            class="inline-flex items-center gap-1.5 text-xs text-neon-cyan/70 hover:text-neon-cyan transition-colors uppercase tracking-widest"
          >
            &lt;-- back
          </RouterLink>

          <!-- What is Mandator -->
          <section>
            <h2 class="text-sm uppercase tracking-widest text-neon-cyan text-glow-cyan mb-3">
              $ cat what_is_mandator.txt
            </h2>
            <div class="text-foreground/70 text-sm leading-relaxed space-y-3">
              <p>
                Mandator is a <span class="text-neon-cyan">peer-to-peer file transfer</span> tool
                that sends files directly from one browser to another. No cloud uploads, no accounts,
                no file size limits — just a direct connection between you and the recipient.
              </p>
              <p>
                Your files never touch our servers. They travel straight from your device to
                the other person's device, as if you were handing them a USB stick — except it
                works across the internet.
              </p>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-neon-cyan/20 via-neon-magenta/10 to-transparent" />

          <!-- How it works -->
          <section>
            <h2 class="text-sm uppercase tracking-widest text-neon-magenta text-glow-magenta mb-3">
              $ cat how_it_works.txt
            </h2>
            <div class="text-foreground/70 text-sm leading-relaxed space-y-3">
              <p>
                Mandator uses <span class="text-neon-magenta">WebRTC</span> — the same technology
                browsers use for video calls — to create a direct, encrypted tunnel between two devices.
              </p>
              <p>
                The process has two phases:
              </p>
              <div class="border border-border/50 bg-secondary/20 p-4 space-y-3 text-xs">
                <div>
                  <span class="text-neon-amber">1. Handshake</span>
                  <span class="text-muted-foreground"> (takes ~2 seconds)</span>
                  <p class="text-foreground/60 mt-1">
                    A lightweight signaling server helps the two browsers find each other and exchange
                    connection details. Think of it as introducing two people at a party — once they've
                    met, the introducer steps away.
                  </p>
                </div>
                <div>
                  <span class="text-neon-green">2. Transfer</span>
                  <span class="text-muted-foreground"> (direct, no server)</span>
                  <p class="text-foreground/60 mt-1">
                    After the handshake, your file data flows directly between the two browsers over an
                    encrypted channel. The signaling server is no longer involved. Integrity is verified
                    with SHA-256 hashing on both ends.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-neon-magenta/20 via-neon-cyan/10 to-transparent" />

          <!-- Encryption -->
          <section>
            <h2 class="text-sm uppercase tracking-widest text-neon-green text-glow-green mb-3">
              $ cat encryption.txt
            </h2>
            <div class="text-foreground/70 text-sm leading-relaxed space-y-3">
              <p>
                All data transferred through Mandator is encrypted using
                <span class="text-neon-green">DTLS</span>
                <span class="text-muted-foreground">(Datagram Transport Layer Security)</span>,
                which is built into WebRTC. This is the same class of encryption that protects HTTPS websites.
              </p>
              <p>
                The encryption keys are negotiated directly between the two browsers. No server —
                not even ours — has the keys to decrypt your files. Even if a relay server is used
                (more on that below), it only sees encrypted data it cannot read.
              </p>
            </div>
          </section>

          <div class="h-px bg-gradient-to-r from-neon-green/20 via-neon-amber/10 to-transparent" />

          <!-- TURN servers -->
          <section>
            <h2 class="text-sm uppercase tracking-widest text-neon-amber text-glow-amber mb-3">
              $ cat turn_servers.txt
            </h2>
            <div class="text-foreground/70 text-sm leading-relaxed space-y-3">
              <p>
                In most cases, Mandator creates a <span class="text-neon-cyan">direct connection</span>
                between the two browsers — no servers in the middle. But sometimes, network conditions
                make a direct connection impossible.
              </p>

              <div class="border border-border/50 bg-secondary/20 p-4 space-y-3 text-xs">
                <div>
                  <span class="text-neon-amber">When is a direct connection blocked?</span>
                  <p class="text-foreground/60 mt-1">
                    Some corporate firewalls, strict NAT configurations (like symmetric NAT), or
                    certain mobile networks actively block peer-to-peer connections. When this happens,
                    the two browsers simply cannot reach each other directly.
                  </p>
                </div>
                <div>
                  <span class="text-neon-amber">What is a TURN server?</span>
                  <p class="text-foreground/60 mt-1">
                    TURN
                    <span class="text-muted-foreground">(Traversal Using Relays around NAT)</span>
                    is a fallback relay. When a direct connection fails, both browsers connect to the
                    TURN server instead, and it forwards data between them. Think of it as a postal
                    service — it carries sealed envelopes but can't open them.
                  </p>
                </div>
                <div>
                  <span class="text-neon-amber">Is it still encrypted?</span>
                  <p class="text-foreground/60 mt-1">
                    <span class="text-neon-green">Yes.</span> The TURN server only sees encrypted
                    packets. It has no access to your files, filenames, or any content. End-to-end
                    encryption is maintained regardless of whether the connection is direct or relayed.
                  </p>
                </div>
                <div>
                  <span class="text-neon-amber">Is it slower?</span>
                  <p class="text-foreground/60 mt-1">
                    Relayed connections are slower than direct ones because data has to travel through
                    an extra server. Transfer speed depends on the TURN server's location and bandwidth.
                    Mandator will always prefer a direct connection when one is available.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <!-- Footer -->
          <div class="pt-4">
            <div class="h-px bg-gradient-to-r from-neon-cyan/30 via-neon-magenta/20 to-transparent" />
            <p class="mt-3 text-[0.625rem] text-muted-foreground/60 uppercase tracking-widest">
              // mandator — peer-to-peer file transfer
            </p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
