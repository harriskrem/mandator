import { vi } from 'vitest'

// Mock RTCPeerConnection for tests that need peerStore
class MockRTCPeerConnection {
  iceConnectionState = 'new'
  remoteDescription: RTCSessionDescription | null = null
  sctp = { maxMessageSize: 65535 }

  createDataChannel() {
    return {
      binaryType: 'arraybuffer',
      readyState: 'open',
      send: vi.fn(),
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
    }
  }

  addEventListener = vi.fn()
  removeEventListener = vi.fn()
  createOffer = vi.fn().mockResolvedValue({})
  createAnswer = vi.fn().mockResolvedValue({})
  setLocalDescription = vi.fn().mockResolvedValue(undefined)
  setRemoteDescription = vi.fn().mockResolvedValue(undefined)
  addIceCandidate = vi.fn().mockResolvedValue(undefined)
  close = vi.fn()
}

class MockRTCSessionDescription {
  type: string
  sdp: string
  constructor(init: { type: string; sdp: string }) {
    this.type = init.type
    this.sdp = init.sdp
  }
}

class MockRTCIceCandidate {
  candidate: string
  constructor(init: { candidate: string }) {
    this.candidate = init.candidate
  }
}

vi.stubGlobal('RTCPeerConnection', MockRTCPeerConnection)
vi.stubGlobal('RTCSessionDescription', MockRTCSessionDescription)
vi.stubGlobal('RTCIceCandidate', MockRTCIceCandidate)
