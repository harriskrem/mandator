/** Maximum chunk size for WebRTC data channel (SCTP limit) */
export const MAX_CHUNK_SIZE = 26_214;

/** Expected length of Socket.IO-assigned peer IDs */
export const PEER_ID_LENGTH = 20;

/** Data channel configuration */
export const DATA_CHANNEL_CONFIG: RTCDataChannelInit = {
  ordered: true,
  maxRetransmits: 10,
};

/** Data channel label */
export const DATA_CHANNEL_LABEL = "dataTransfer";

/** Peer ID validation pattern (alphanumeric + hyphens/underscores) */
export const PEER_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
