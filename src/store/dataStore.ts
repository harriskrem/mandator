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
  const sendCompleteRef = ref(false)

  const filesToReceive = computed(() => filesToReceiveRef.value)
  const filesToSend = computed(() => filesToSendRef.value)
  const recFileId = computed(() => recFileIdRef.value)
  const sendFileId = computed(() => sendFileIdRef.value)
  const transferError = computed(() => transferErrorRef.value)
  const sendComplete = computed(() => sendCompleteRef.value)

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

  const setReceivedChunks = (value: Blob | ArrayBuffer) => {
    const fileId = recFileIdRef.value
    if (!fileId) return
    const file = filesToReceiveRef.value[fileId]
    if (!file) return
    const chunkSize = value instanceof Blob ? value.size : value.byteLength
    file.chunks.push(value instanceof Blob ? value : new Blob([value]))
    file.progress += chunkSize
  }

  const setFileToSend = (fileId: string, fileToSend: File) => {
    if (!filesToSend?.value[fileId]) {
      filesToSendRef.value[fileId] = {
        file: fileToSend,
        progress: 0,
        sent: false,
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

  const markFileAsSent = (fileId: string) => {
    const file = filesToSendRef.value[fileId]
    if (file) {
      file.sent = true
    }
  }

  const markFileForResend = (oldFileId: string, newFileId: string) => {
    const oldEntry = filesToSendRef.value[oldFileId]
    if (!oldEntry) return
    delete filesToSendRef.value[oldFileId]
    filesToSendRef.value[newFileId] = {
      file: oldEntry.file,
      progress: 0,
      sent: false,
    }
    sendCompleteRef.value = false
  }

  const setSendComplete = (value: boolean) => {
    sendCompleteRef.value = value
  }

  const resetData = () => {
    filesToReceiveRef.value = {}
    filesToSendRef.value = {}
    recFileIdRef.value = undefined
    sendFileIdRef.value = undefined
    transferErrorRef.value = null
    sendCompleteRef.value = false
  }

  return {
    filesToReceive,
    filesToSend,
    recFileId,
    sendFileId,
    transferError,
    sendComplete,
    setFileDescription,
    setReceivedChunks,
    setDataSentProgress,
    setFileToSend,
    setSendFileId,
    setTransferError,
    clearTransferError,
    markFileAsSent,
    markFileForResend,
    setSendComplete,
    verifyFileIntegrity,
    resetData,
  }
})
