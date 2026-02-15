import { describe, expect, it } from 'vitest'
import { computeBlobHash, computeFileHash } from '@/utils/computeHash'

describe('computeHash', () => {
  describe('computeFileHash', () => {
    it('returns a 64-char hex string', async () => {
      const file = new File(['hello world'], 'test.txt')
      const hash = await computeFileHash(file)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]+$/)
    })

    it('produces consistent hashes for same content', async () => {
      const file1 = new File(['same content'], 'a.txt')
      const file2 = new File(['same content'], 'b.txt')
      const hash1 = await computeFileHash(file1)
      const hash2 = await computeFileHash(file2)
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different content', async () => {
      const file1 = new File(['content A'], 'a.txt')
      const file2 = new File(['content B'], 'b.txt')
      const hash1 = await computeFileHash(file1)
      const hash2 = await computeFileHash(file2)
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('computeBlobHash', () => {
    it('returns a 64-char hex string', async () => {
      const chunks = [new Blob(['hello']), new Blob([' world'])]
      const hash = await computeBlobHash(chunks)
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]+$/)
    })

    it('matches file hash for same content', async () => {
      const content = 'hello world'
      const file = new File([content], 'test.txt')
      const chunks = [new Blob([content])]

      const fileHash = await computeFileHash(file)
      const blobHash = await computeBlobHash(chunks)
      expect(fileHash).toBe(blobHash)
    })
  })
})
