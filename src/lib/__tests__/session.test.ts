import { describe, it, expect } from 'vitest'
import { sign, verify } from '../session'

describe('sign', () => {
  it('produces a two-part base64url token', async () => {
    const token = await sign({ id: '123', name: 'Test', role: 'trainer' })
    const parts = token.split('.')
    expect(parts).toHaveLength(2)
    // Each part should be non-empty base64url
    expect(parts[0].length).toBeGreaterThan(0)
    expect(parts[1].length).toBeGreaterThan(0)
  })

  it('produces different tokens for different payloads', async () => {
    const token1 = await sign({ id: '1' })
    const token2 = await sign({ id: '2' })
    expect(token1).not.toBe(token2)
  })

  it('produces consistent tokens for same payload', async () => {
    const payload = { id: '123', role: 'admin' }
    const token1 = await sign(payload)
    const token2 = await sign(payload)
    expect(token1).toBe(token2)
  })
})

describe('verify', () => {
  it('returns original payload for valid token', async () => {
    const payload = { id: '123', name: 'Test', role: 'trainer' }
    const token = await sign(payload)
    const result = await verify(token)
    expect(result).toEqual(payload)
  })

  it('returns null for empty string', async () => {
    const result = await verify('')
    expect(result).toBeNull()
  })

  it('returns null for malformed token (no dot)', async () => {
    const result = await verify('nodothere')
    expect(result).toBeNull()
  })

  it('returns null for token with too many parts', async () => {
    const result = await verify('a.b.c')
    expect(result).toBeNull()
  })

  it('returns null for tampered signature', async () => {
    const token = await sign({ id: '123' })
    const [payload] = token.split('.')
    const tampered = `${payload}.AAAA_tampered_BBBB`
    const result = await verify(tampered)
    expect(result).toBeNull()
  })

  it('returns null for tampered payload', async () => {
    const token = await sign({ id: '123' })
    const [, signature] = token.split('.')
    // Create a different payload
    const fakePayload = btoa(JSON.stringify({ id: '999', role: 'headcoach' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const tampered = `${fakePayload}.${signature}`
    const result = await verify(tampered)
    expect(result).toBeNull()
  })

  it('roundtrips complex payloads', async () => {
    const payload = {
      id: 'abc-def-123',
      name: 'أحمد',
      role: 'headcoach',
    }
    const token = await sign(payload)
    const result = await verify(token)
    expect(result).toEqual(payload)
  })
})
