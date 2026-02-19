import { useDataStore } from '@/store/dataStore'
import { getTransferFile, isOpfsSupported } from '@/utils/opfsStorage'

export default async function saveFile(fileId: string) {
  const dataStore = useDataStore()
  const incomingFiles = dataStore.filesToReceive
  const fileToSave = incomingFiles[fileId]

  if (!fileToSave) {
    console.error(`File with id ${fileId} not found`)
    return
  }

  let blob: Blob

  if (isOpfsSupported()) {
    blob = await getTransferFile(fileId)
  } else if (fileToSave.chunks) {
    blob = new Blob(fileToSave.chunks)
  } else {
    console.error(`No data available for file ${fileId}`)
    return
  }

  if (blob.size === fileToSave.size) {
    const fileURL = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = fileURL
    link.download = fileToSave.filename
    link.click()
    window.URL.revokeObjectURL(fileURL)
  }
}
