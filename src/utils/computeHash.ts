import { createSHA256 } from 'hash-wasm'

export async function computeFileHash(file: File): Promise<string> {
  const hasher = await createSHA256()
  const reader = file.stream().getReader()

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    hasher.update(value)
  }

  return hasher.digest('hex')
}

export async function computeBlobHash(chunks: Blob[]): Promise<string> {
  const hasher = await createSHA256()

  for (const chunk of chunks) {
    const buffer = await chunk.arrayBuffer()
    hasher.update(new Uint8Array(buffer))
  }

  return hasher.digest('hex')
}
