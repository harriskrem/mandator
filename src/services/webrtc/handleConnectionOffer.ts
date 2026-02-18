import type { Socket } from 'socket.io-client'

type HandleConnectionOffer = {
  pc: RTCPeerConnection
  offer: RTCSessionDescriptionInit
  socket: Socket
  peerId: string
}

export default async function handleConnectionOffer(
  props: HandleConnectionOffer,
) {
  const { pc, offer, socket, peerId } = props

  await pc.setRemoteDescription(offer)
  const answer = await pc.createAnswer()
  await pc.setLocalDescription(answer)

  socket.emit('answer', {
    answer: answer,
    peerId: peerId,
  })
}
