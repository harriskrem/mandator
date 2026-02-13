import { MAX_CHUNK_SIZE } from "@/config/constants";
import { useDataStore } from "@/store/dataStore";
import type { SendFile } from "@/types/SendFile";
import { computeFileHash } from "@/utils/computeHash";

export default function sendChunks(
  filesToSend: Record<string, SendFile>,
  pc: RTCPeerConnection,
  dataChannel: RTCDataChannel,
) {
  const fileHashes = Object.keys(filesToSend);
  if (!fileHashes.length) return;

  const chunkSize = Math.min(
    (pc.sctp as RTCSctpTransport).maxMessageSize,
    MAX_CHUNK_SIZE,
  );

  const dataStore = useDataStore();

  const progressHandler = (event: MessageEvent) => {
    if (typeof event.data === "string") {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "progress" && data.id) {
          dataStore.setDataSentProgress({
            id: data.id,
            progress: data.progress,
          });
        }
      } catch (e) {
        console.error("Error parsing progress message:", e);
      }
    }
  };

  dataChannel.addEventListener("message", progressHandler);

  let currentIndex = 0;

  const sendFileAtIndex = async () => {
    if (currentIndex >= fileHashes.length) {
      dataChannel.removeEventListener("message", progressHandler);
      return;
    }

    const fileHash = fileHashes[currentIndex]!;
    const fileToSend = filesToSend[fileHash];
    if (!fileToSend) {
      currentIndex++;
      sendFileAtIndex();
      return;
    }

    try {
      const hash = await computeFileHash(fileToSend.file);

      dataChannel.send(
        JSON.stringify({
          type: "description",
          id: fileHash,
          filename: fileToSend.file.name,
          size: fileToSend.file.size,
          hash,
        }),
      );

      dataStore.setSendFileId(fileHash);

      const fileData = await fileToSend.file.arrayBuffer();
      const totalChunks = Math.ceil(fileData.byteLength / chunkSize);
      let offset = 0;

      const sendNextChunk = () => {
        if (dataChannel.readyState !== "open") {
          dataStore.setTransferError(fileHash, "Data channel closed during transfer");
          dataChannel.removeEventListener("message", progressHandler);
          return;
        }

        if (offset >= fileData.byteLength) {
          dataChannel.send(
            JSON.stringify({
              type: "complete",
              id: fileHash,
              totalChunks,
            }),
          );
          currentIndex++;
          sendFileAtIndex();
          return;
        }

        const chunk = fileData.slice(offset, offset + chunkSize);
        dataChannel.send(chunk);
        offset += chunkSize;
        setTimeout(sendNextChunk, 0);
      };

      sendNextChunk();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error sending file";
      dataStore.setTransferError(fileHash, message);
      console.error("Error sending file:", error);
    }
  };

  sendFileAtIndex();
}
