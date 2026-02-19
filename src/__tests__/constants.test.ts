import { describe, expect, it } from 'vitest'
import {
  DATA_CHANNEL_CONFIG,
  DATA_CHANNEL_LABEL,
  MAX_CHUNK_SIZE,
  PEER_ID_LENGTH,
  PEER_ID_PATTERN,
} from '@/config/constants'

describe('constants', () => {
  it('MAX_CHUNK_SIZE is within SCTP limits', () => {
    expect(MAX_CHUNK_SIZE).toBeLessThanOrEqual(262_144)
    expect(MAX_CHUNK_SIZE).toBeGreaterThan(0)
  })

  it('PEER_ID_LENGTH is a positive integer', () => {
    expect(PEER_ID_LENGTH).toBeGreaterThan(0)
    expect(Number.isInteger(PEER_ID_LENGTH)).toBe(true)
  })

  it('DATA_CHANNEL_CONFIG has required fields', () => {
    expect(DATA_CHANNEL_CONFIG.ordered).toBe(true)
  })

  it('DATA_CHANNEL_LABEL is a non-empty string', () => {
    expect(DATA_CHANNEL_LABEL).toBeTruthy()
    expect(typeof DATA_CHANNEL_LABEL).toBe('string')
  })

  describe('PEER_ID_PATTERN', () => {
    it('accepts valid peer IDs', () => {
      expect(PEER_ID_PATTERN.test('abc123')).toBe(true)
      expect(PEER_ID_PATTERN.test('ABC_def-123')).toBe(true)
      expect(PEER_ID_PATTERN.test('a1b2c3d4e5f6g7h8i9j0')).toBe(true)
    })

    it('rejects invalid peer IDs', () => {
      expect(PEER_ID_PATTERN.test('abc 123')).toBe(false)
      expect(PEER_ID_PATTERN.test('abc<script>')).toBe(false)
      expect(PEER_ID_PATTERN.test('abc/def')).toBe(false)
      expect(PEER_ID_PATTERN.test('')).toBe(false)
    })
  })
})
