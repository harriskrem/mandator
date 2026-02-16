import { MSG_TYPE_ENCRYPTED_BINARY, MSG_TYPE_ENCRYPTED_JSON } from './types'

let fileCounter = 0

export function nextFileCounter(): number {
  return fileCounter++
}

export function resetFileCounter(): void {
  fileCounter = 0
}

/**
 * Build a 12-byte IV: 4-byte file counter + 4-byte chunk index + 4 random bytes
 */
function buildIV(fileId: number, chunkIndex: number): Uint8Array {
  const iv = new Uint8Array(12)
  const view = new DataView(iv.buffer)
  view.setUint32(0, fileId)
  view.setUint32(4, chunkIndex)
  crypto.getRandomValues(iv.subarray(8, 12))
  return iv
}

export async function encryptChunk(
  chunk: ArrayBuffer,
  key: CryptoKey,
  fileId: number,
  chunkIndex: number,
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const iv = buildIV(fileId, chunkIndex)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, chunk)
  return { iv, ciphertext }
}

export async function decryptChunk(
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
  key: CryptoKey,
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
}

/**
 * Pack an encrypted message into wire format:
 * [1 byte type flag][12 byte IV][ciphertext + 16 byte GCM tag]
 */
export function packEncryptedMessage(
  typeFlag: number,
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
): ArrayBuffer {
  const result = new ArrayBuffer(1 + 12 + ciphertext.byteLength)
  const view = new Uint8Array(result)
  view[0] = typeFlag
  view.set(iv, 1)
  view.set(new Uint8Array(ciphertext), 13)
  return result
}

/**
 * Unpack a wire-format encrypted message.
 */
export function unpackEncryptedMessage(data: ArrayBuffer): {
  typeFlag: number
  iv: Uint8Array
  ciphertext: ArrayBuffer
} {
  const view = new Uint8Array(data)
  const typeFlag = view[0]
  const iv = view.slice(1, 13)
  const ciphertext = view.slice(13).buffer
  return { typeFlag, iv, ciphertext }
}

/** Overhead per encrypted message: 1 (flag) + 12 (IV) + 16 (GCM tag) */
export const ENCRYPTION_OVERHEAD = 29

export { MSG_TYPE_ENCRYPTED_BINARY, MSG_TYPE_ENCRYPTED_JSON }
