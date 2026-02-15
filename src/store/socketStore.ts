import { defineStore, type StoreDefinition } from 'pinia'
import { io, type Socket } from 'socket.io-client'
import { computed, ref } from 'vue'
import { setupSocketListeners } from '@/services/socket'

export const useSocketStore: StoreDefinition = defineStore('socket', () => {
  // Socket refs
  const socket = ref<Socket>()

  // Getters
  const getSocket = computed(() => socket.value)

  // Setters
  const initializeSocket = () => {
    const signalServerUrl = import.meta.env.VITE_SIGNAL_SERVER_URL?.trim()

    socket.value = signalServerUrl ? io(signalServerUrl) : io()
    setupSocketListeners(socket.value)
  }

  return { getSocket, initializeSocket }
})
