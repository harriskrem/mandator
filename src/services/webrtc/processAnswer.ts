export default async function processAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit,
) {
  await pc.setRemoteDescription(new RTCSessionDescription(answer))
}
