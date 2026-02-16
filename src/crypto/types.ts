export interface EncryptedChunkMessage {
  iv: Uint8Array // 12 bytes, prepended to ciphertext on the wire
  ciphertext: ArrayBuffer
}

/** Type flags for encrypted wire messages */
export const MSG_TYPE_ENCRYPTED_JSON = 0x01
export const MSG_TYPE_ENCRYPTED_BINARY = 0x02
