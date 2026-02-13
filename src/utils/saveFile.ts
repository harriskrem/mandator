
import { useDataStore } from "@/store/dataStore";

export default function saveFile(fileId: string) {
  const dataStore = useDataStore();
  const incomingFiles = dataStore.filesToReceive;
  const fileToSave = incomingFiles[fileId];

  if (!fileToSave) {
    console.error(`File with id ${fileId} not found`);
    return;
  }

  const blob = new Blob(fileToSave.chunks);

  if (blob.size === fileToSave.size) {
    const fileURL = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileURL;
    link.download = fileToSave.filename;
    link.click();
    window.URL.revokeObjectURL(fileURL);
  }
}