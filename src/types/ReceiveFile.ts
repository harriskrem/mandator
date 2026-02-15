export type ReceiveFile = {
  filename: string
  size: number
  progress: number
  chunks: Blob[]
  hash?: string
  verified?: boolean | null
  file?: File
}
