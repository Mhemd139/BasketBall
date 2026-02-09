// We need a consistent secret.
// In Edge runtime, process.env is accessed differently sometimes, but Next.js handles it.
const secretKey = process.env.SESSION_SECRET || 'default-secret-key-change-me-in-production'

function getCryptoKey() {
    const enc = new TextEncoder()
    return crypto.subtle.importKey(
        'raw',
        enc.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    )
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64UrlToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

export async function sign(payload: any): Promise<string> {
  const key = await getCryptoKey()
  const data = JSON.stringify(payload)
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    dataBuffer
  )

  const payloadBase64 = arrayBufferToBase64Url(dataBuffer.buffer)
  const signatureBase64 = arrayBufferToBase64Url(signature)

  return `${payloadBase64}.${signatureBase64}`
}

export async function verify(token: string): Promise<any | null> {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null

  const [payloadBase64, signatureBase64] = parts

  try {
    const key = await getCryptoKey()

    const dataBuffer = base64UrlToArrayBuffer(payloadBase64)
    const signatureBuffer = base64UrlToArrayBuffer(signatureBase64)

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      dataBuffer
    )

    if (!isValid) return null

    const decoder = new TextDecoder()
    const data = decoder.decode(dataBuffer)
    return JSON.parse(data)
  } catch (e) {
    console.error('Session verification failed:', e)
    return null
  }
}
