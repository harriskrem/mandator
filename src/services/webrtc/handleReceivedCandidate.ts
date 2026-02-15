export default async function handleReceivedCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidate,
) {
  if (candidate && pc.remoteDescription?.type) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate))
  }
}
