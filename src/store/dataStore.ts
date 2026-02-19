import { createSHA256 } from 'hash-wasm'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FileDescription } from '@/types/FileDescription'
import type { FileProgress } from '@/types/FileProgress'
import type { ReceiveFile } from '@/types/ReceiveFile'
import type { SendFile } from '@/types/SendFile'
import { computeBlobHash } from '@/utils/computeHash'
import {
  clearAllTransfers,
  createTransferFile,
  getTransferFile,
  isOpfsSupported,
} from '@/utils/opfsStorage'

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

  const setFileDescription = async (value: FileDescription) => {
    const entry: ReceiveFile = {
      filename: value.filename,
      size: value.size,
      progress: 0,
      hash: value.hash,
      verified: null,
    }

    if (isOpfsSupported()) {
      entry.writable = await createTransferFile(value.id)
    } else {
      entry.chunks = []
    }

    filesToReceiveRef.value[value.id] = entry
    recFileIdRef.value = value.id
  }

  const verifyFileIntegrity = async (
    fileId: string,
  ): Promise<boolean | null> => {
    const file = filesToReceiveRef.value[fileId]
    if (!file?.hash) return null

    let receivedHash: string

    if (isOpfsSupported()) {
      const opfsFile = await getTransferFile(fileId)
      const hasher = await createSHA256()
      const reader = opfsFile.stream().getReader()

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        hasher.update(value)
      }

      receivedHash = hasher.digest('hex')
    } else if (file.chunks) {
      receivedHash = await computeBlobHash(file.chunks)
    } else {
      return null
    }

    const verified = receivedHash === file.hash
    file.verified = verified
    return verified
  }

  const setReceivedChunks = async (value: Blob | ArrayBuffer) => {
    const fileId = recFileIdRef.value
    if (!fileId) return
    const file = filesToReceiveRef.value[fileId]
    if (!file) return

    const chunkSize = value instanceof Blob ? value.size : value.byteLength

    if (file.writable) {
      // OPFS mode: write directly to disk
      await file.writable.write(value)
    } else if (file.chunks) {
      // Fallback: accumulate in memory
      file.chunks.push(value instanceof Blob ? value : new Blob([value]))
    }

    file.progress += chunkSize
  }

  const setFileHash = (fileId: string, hash: string) => {
    const file = filesToReceiveRef.value[fileId]
    if (file) {
      file.hash = hash
    }
  }

  const finalizeReceive = async (fileId: string) => {
    const file = filesToReceiveRef.value[fileId]
    if (file?.writable) {
      await file.writable.close()
      file.writable = undefined
    }
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

  const resetData = async () => {
    // Close any open writable streams
    for (const file of Object.values(filesToReceiveRef.value)) {
      if (file.writable) {
        try { await file.writable.close() } catch { /* ignore */ }
      }
    }
    if (isOpfsSupported()) {
      await clearAllTransfers()
    }
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
    setFileHash,
    finalizeReceive,
    verifyFileIntegrity,
    resetData,
  }
})
