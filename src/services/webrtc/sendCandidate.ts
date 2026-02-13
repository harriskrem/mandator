import { PEER_ID_LENGTH, PEER_ID_PATTERN } from "@/config/constants";
import type { Socket } from "socket.io-client";

export default function sendCandidate(
  candidate: RTCIceCandidate | null,
  remoteId: string,
  pc: RTCPeerConnection | null,
  socket: Socket,
) {
  if (
    remoteId.length === PEER_ID_LENGTH &&
    PEER_ID_PATTERN.test(remoteId) &&
    pc
  ) {
    socket.emit("send_candidate", {
      candidate: candidate,
      peerId: remoteId,
    });
  }
}
