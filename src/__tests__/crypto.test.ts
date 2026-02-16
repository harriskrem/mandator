import { describe, expect, it, beforeEach } from 'vitest'
import {
  generateKeyPair,
  exportPublicKey,
  deriveEncryptionKey,
  computeFingerprint,
} from '@/crypto/keyExchange'
import {
  encryptChunk,
  decryptChunk,
  packEncryptedMessage,
  unpackEncryptedMessage,
  nextFileCounter,
  resetFileCounter,
  ENCRYPTION_OVERHEAD,
  MSG_TYPE_ENCRYPTED_BINARY,
  MSG_TYPE_ENCRYPTED_JSON,
} from '@/crypto/chunkEncryption'

async function deriveSharedKey(): Promise<CryptoKey> {
  const alice = await generateKeyPair()
  const bob = await generateKeyPair()
  const bobPubJwk = await exportPublicKey(bob.publicKey)
  return deriveEncryptionKey(alice.privateKey, bobPubJwk)
}

describe('keyExchange', () => {
  it('both peers derive the same key material', async () => {
    const alice = await generateKeyPair()
    const bob = await generateKeyPair()

    const alicePubJwk = await exportPublicKey(alice.publicKey)
    const bobPubJwk = await exportPublicKey(bob.publicKey)

    const aliceKey = await deriveEncryptionKey(alice.privateKey, bobPubJwk)
    const bobKey = await deriveEncryptionKey(bob.privateKey, alicePubJwk)

    // Encrypt with Alice's key, decrypt with Bob's — should roundtrip
    const plaintext = new TextEncoder().encode('hello from alice')
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aliceKey,
      plaintext,
    )
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      bobKey,
      ciphertext,
    )

    expect(new Uint8Array(decrypted)).toEqual(plaintext)
  })

  it('computeFingerprint returns a hex string', async () => {
    const pair = await generateKeyPair()
    const jwk = await exportPublicKey(pair.publicKey)
    const fingerprint = await computeFingerprint(jwk)

    expect(fingerprint).toMatch(/^[0-9a-f]{4}( [0-9a-f]{4})+$/)
  })

  it('same key produces the same fingerprint', async () => {
    const pair = await generateKeyPair()
    const jwk = await exportPublicKey(pair.publicKey)

    const fp1 = await computeFingerprint(jwk)
    const fp2 = await computeFingerprint(jwk)

    expect(fp1).toBe(fp2)
  })

  it('different keys produce different fingerprints', async () => {
    const pair1 = await generateKeyPair()
    const pair2 = await generateKeyPair()

    const fp1 = await computeFingerprint(await exportPublicKey(pair1.publicKey))
    const fp2 = await computeFingerprint(await exportPublicKey(pair2.publicKey))

    expect(fp1).not.toBe(fp2)
  })
})

describe('chunkEncryption', () => {
  beforeEach(() => {
    resetFileCounter()
  })

  it('encrypt then decrypt roundtrips', async () => {
    const key = await deriveSharedKey()
    const original = new TextEncoder().encode('test payload 1234')

    const { iv, ciphertext } = await encryptChunk(original.buffer, key, 0, 0)
    const decrypted = await decryptChunk(iv, ciphertext, key)

    expect(new Uint8Array(decrypted)).toEqual(original)
  })

  it('ciphertext differs from plaintext', async () => {
    const key = await deriveSharedKey()
    const original = new TextEncoder().encode('secret data')

    const { ciphertext } = await encryptChunk(original.buffer, key, 0, 0)

    expect(new Uint8Array(ciphertext)).not.toEqual(original)
  })

  it('decryption with wrong key fails', async () => {
    const key1 = await deriveSharedKey()
    const key2 = await deriveSharedKey()
    const original = new TextEncoder().encode('private')

    const { iv, ciphertext } = await encryptChunk(original.buffer, key1, 0, 0)

    await expect(decryptChunk(iv, ciphertext, key2)).rejects.toThrow()
  })

  it('handles empty payload', async () => {
    const key = await deriveSharedKey()
    const empty = new ArrayBuffer(0)

    const { iv, ciphertext } = await encryptChunk(empty, key, 0, 0)
    const decrypted = await decryptChunk(iv, ciphertext, key)

    expect(decrypted.byteLength).toBe(0)
  })

  it('handles large payload', async () => {
    const key = await deriveSharedKey()
    const large = new Uint8Array(64 * 1024)
    crypto.getRandomValues(large)

    const { iv, ciphertext } = await encryptChunk(large.buffer, key, 0, 0)
    const decrypted = await decryptChunk(iv, ciphertext, key)

    expect(new Uint8Array(decrypted)).toEqual(large)
  })

  it('nextFileCounter increments and resetFileCounter resets', () => {
    expect(nextFileCounter()).toBe(0)
    expect(nextFileCounter()).toBe(1)
    expect(nextFileCounter()).toBe(2)
    resetFileCounter()
    expect(nextFileCounter()).toBe(0)
  })
})

describe('pack/unpack wire format', () => {
  it('roundtrips binary type flag', async () => {
    const key = await deriveSharedKey()
    const original = new TextEncoder().encode('wire test')
    const { iv, ciphertext } = await encryptChunk(original.buffer, key, 0, 0)

    const packed = packEncryptedMessage(MSG_TYPE_ENCRYPTED_BINARY, iv, ciphertext)
    const unpacked = unpackEncryptedMessage(packed)

    expect(unpacked.typeFlag).toBe(MSG_TYPE_ENCRYPTED_BINARY)
    expect(unpacked.iv).toEqual(iv)

    const decrypted = await decryptChunk(unpacked.iv, unpacked.ciphertext, key)
    expect(new Uint8Array(decrypted)).toEqual(original)
  })

  it('roundtrips JSON type flag', async () => {
    const key = await deriveSharedKey()
    const json = new TextEncoder().encode(JSON.stringify({ file: 'test.txt' }))
    const { iv, ciphertext } = await encryptChunk(json.buffer, key, 0, 0)

    const packed = packEncryptedMessage(MSG_TYPE_ENCRYPTED_JSON, iv, ciphertext)
    const unpacked = unpackEncryptedMessage(packed)

    expect(unpacked.typeFlag).toBe(MSG_TYPE_ENCRYPTED_JSON)

    const decrypted = await decryptChunk(unpacked.iv, unpacked.ciphertext, key)
    const parsed = JSON.parse(new TextDecoder().decode(decrypted))
    expect(parsed.file).toBe('test.txt')
  })

  it('packed size matches expected overhead', async () => {
    const key = await deriveSharedKey()
    const payload = new TextEncoder().encode('size check')
    const { iv, ciphertext } = await encryptChunk(payload.buffer, key, 0, 0)

    const packed = packEncryptedMessage(MSG_TYPE_ENCRYPTED_BINARY, iv, ciphertext)

    // packed = 1 (flag) + 12 (IV) + ciphertext (plaintext + 16 GCM tag)
    expect(packed.byteLength).toBe(1 + 12 + ciphertext.byteLength)
    // ciphertext = plaintext + 16 byte GCM tag
    expect(ciphertext.byteLength).toBe(payload.byteLength + 16)
    // total overhead
    expect(ENCRYPTION_OVERHEAD).toBe(1 + 12 + 16)
  })
})
