import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FileDescription } from '@/types/FileDescription'
import type { FileProgress } from '@/types/FileProgress'
import type { ReceiveFile } from '@/types/ReceiveFile'
import type { SendFile } from '@/types/SendFile'
import { computeBlobHash } from '@/utils/computeHash'

export type TransferError = {
  fileId: string
  message: string
}

export const useDataStore = defineStore('data', () => {
  const filesToReceiveRef = ref<Record<string, ReceiveFile>>({})
  const filesToSendRef = ref<Record<string, SendFile>>({})
  const recFileIdRef = ref<string | undefined>()
  const sendFileIdRef = ref<string | undefined>()
  const transferErrorRef = ref<TransferError | null>(null)

  const filesToReceive = computed(() => filesToReceiveRef.value)
  const filesToSend = computed(() => filesToSendRef.value)
  const recFileId = computed(() => recFileIdRef.value)
  const sendFileId = computed(() => sendFileIdRef.value)
  const transferError = computed(() => transferErrorRef.value)

  const setFileDescription = (value: FileDescription) => {
    filesToReceiveRef.value[value.id] = {
      filename: value.filename,
      size: value.size,
      progress: 0,
      chunks: [],
      hash: value.hash,
      verified: null,
    }
    recFileIdRef.value = value.id
  }

  const verifyFileIntegrity = async (
    fileId: string,
  ): Promise<boolean | null> => {
    const file = filesToReceiveRef.value[fileId]
    if (!file?.hash) return null
    const receivedHash = await computeBlobHash(file.chunks)
    const verified = receivedHash === file.hash
    file.verified = verified
    return verified
  }

  const setReceivedChunks = (value: Blob) => {
    const fileId = recFileIdRef.value
    if (!fileId) return
    const file = filesToReceiveRef.value[fileId]
    if (!file) return
    file.chunks.push(value)
    file.progress = new Blob(file.chunks).size
  }

  const setFileToSend = (fileId: string, fileToSend: File) => {
    if (!filesToSend?.value[fileId]) {
      filesToSendRef.value[fileId] = {
        file: fileToSend,
        progress: 0,
      }
    }
  }

  const setSendFileId = (value: string) => {
    sendFileIdRef.value = value
  }

  const setDataSentProgress = (value: FileProgress) => {
    const file = filesToSendRef.value[value.id]
    if (file) {
      file.progress = value.progress
    }
  }

  const setTransferError = (fileId: string, message: string) => {
    transferErrorRef.value = { fileId, message }
  }

  const clearTransferError = () => {
    transferErrorRef.value = null
  }

  const resetData = () => {
    filesToReceiveRef.value = {}
    filesToSendRef.value = {}
    recFileIdRef.value = undefined
    sendFileIdRef.value = undefined
    transferErrorRef.value = null
  }

  return {
    filesToReceive,
    filesToSend,
    recFileId,
    sendFileId,
    transferError,
    setFileDescription,
    setReceivedChunks,
    setDataSentProgress,
    setFileToSend,
    setSendFileId,
    setTransferError,
    clearTransferError,
    verifyFileIntegrity,
    resetData,
  }
})
