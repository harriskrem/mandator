const TRANSFER_DIR = 'transfers'

async function getTransferDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(TRANSFER_DIR, { create: true })
}

export async function createTransferFile(
  fileId: string,
): Promise<FileSystemWritableFileStream> {
  const dir = await getTransferDir()
  const handle = await dir.getFileHandle(fileId, { create: true })
  return handle.createWritable()
}

export async function getTransferFile(fileId: string): Promise<File> {
  const dir = await getTransferDir()
  const handle = await dir.getFileHandle(fileId)
  return handle.getFile()
}

export async function deleteTransferFile(fileId: string): Promise<void> {
  try {
    const dir = await getTransferDir()
    await dir.removeEntry(fileId)
  } catch {
    // File may already be deleted
  }
}

export async function clearAllTransfers(): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory()
    await root.removeEntry(TRANSFER_DIR, { recursive: true })
  } catch {
    // Directory may not exist
  }
}

export function isOpfsSupported(): boolean {
  return 'storage' in navigator && 'getDirectory' in navigator.storage
}
