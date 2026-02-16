const ECDH_PARAMS: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' }

export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ECDH_PARAMS, false, ['deriveKey', 'deriveBits'])
}

export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key)
}

export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, ECDH_PARAMS, true, [])
}

export async function deriveEncryptionKey(
  myPrivateKey: CryptoKey,
  peerPublicJwk: JsonWebKey,
): Promise<CryptoKey> {
  const peerPublic = await importPublicKey(peerPublicJwk)

  // ECDH → raw shared bits
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublic },
    myPrivateKey,
    256,
  )

  // Import raw bits as HKDF key material
  const hkdfKey = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey'])

  // HKDF → AES-GCM 256-bit key
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // fixed zero salt (ephemeral keys per session)
      info: new TextEncoder().encode('mandator-e2e-file-transfer'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function computeFingerprint(jwk: JsonWebKey): Promise<string> {
  // Deterministic string from JWK fields
  const canonical = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y })
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
  const hex = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  // Group as "abcd efgh ..."
  return hex.match(/.{1,4}/g)!.join(' ')
}
