export type ReceiveFile = {
  filename: string
  size: number
  progress: number
  hash?: string
  verified?: boolean | null
  /** OPFS writable stream (streaming mode) */
  writable?: FileSystemWritableFileStream
  /** In-memory chunk accumulation (fallback when OPFS unavailable) */
  chunks?: Blob[]
}
