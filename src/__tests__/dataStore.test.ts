import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useDataStore } from "@/store/dataStore";

describe("dataStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("initializes with empty state", () => {
    const store = useDataStore();
    expect(Object.keys(store.filesToReceive)).toHaveLength(0);
    expect(Object.keys(store.filesToSend)).toHaveLength(0);
    expect(store.recFileId).toBeUndefined();
    expect(store.sendFileId).toBeUndefined();
    expect(store.transferError).toBeNull();
  });

  describe("setFileDescription", () => {
    it("adds a file to receive with correct metadata", () => {
      const store = useDataStore();
      store.setFileDescription({
        id: "file-1",
        filename: "test.txt",
        size: 1024,
        hash: "abc123",
      });

      expect(store.filesToReceive["file-1"]).toBeDefined();
      expect(store.filesToReceive["file-1"].filename).toBe("test.txt");
      expect(store.filesToReceive["file-1"].size).toBe(1024);
      expect(store.filesToReceive["file-1"].progress).toBe(0);
      expect(store.filesToReceive["file-1"].chunks).toHaveLength(0);
      expect(store.filesToReceive["file-1"].hash).toBe("abc123");
      expect(store.filesToReceive["file-1"].verified).toBeNull();
      expect(store.recFileId).toBe("file-1");
    });

    it("handles description without hash", () => {
      const store = useDataStore();
      store.setFileDescription({
        id: "file-1",
        filename: "test.txt",
        size: 1024,
      });

      expect(store.filesToReceive["file-1"].hash).toBeUndefined();
    });
  });

  describe("setReceivedChunks", () => {
    it("appends chunks and updates progress", () => {
      const store = useDataStore();
      store.setFileDescription({
        id: "file-1",
        filename: "test.txt",
        size: 200,
      });

      const chunk = new Blob(["hello world"]);
      store.setReceivedChunks(chunk);

      expect(store.filesToReceive["file-1"].chunks).toHaveLength(1);
      expect(store.filesToReceive["file-1"].progress).toBeGreaterThan(0);
    });

    it("does nothing without a current file", () => {
      const store = useDataStore();
      const chunk = new Blob(["data"]);
      store.setReceivedChunks(chunk);
      expect(Object.keys(store.filesToReceive)).toHaveLength(0);
    });
  });

  describe("setFileToSend", () => {
    it("queues a file for sending", () => {
      const store = useDataStore();
      const file = new File(["content"], "test.txt");
      store.setFileToSend("file-1", file);

      expect(store.filesToSend["file-1"]).toBeDefined();
      expect(store.filesToSend["file-1"].file.name).toBe("test.txt");
      expect(store.filesToSend["file-1"].progress).toBe(0);
    });

    it("does not overwrite existing file", () => {
      const store = useDataStore();
      const file1 = new File(["content1"], "first.txt");
      const file2 = new File(["content2"], "second.txt");

      store.setFileToSend("file-1", file1);
      store.setFileToSend("file-1", file2);

      expect(store.filesToSend["file-1"].file.name).toBe("first.txt");
    });
  });

  describe("setDataSentProgress", () => {
    it("updates progress for a queued file", () => {
      const store = useDataStore();
      const file = new File(["content"], "test.txt");
      store.setFileToSend("file-1", file);
      store.setDataSentProgress({ id: "file-1", progress: 50 });

      expect(store.filesToSend["file-1"].progress).toBe(50);
    });

    it("ignores progress for unknown file", () => {
      const store = useDataStore();
      store.setDataSentProgress({ id: "unknown", progress: 50 });
      expect(store.filesToSend["unknown"]).toBeUndefined();
    });
  });

  describe("transferError", () => {
    it("sets and clears transfer error", () => {
      const store = useDataStore();
      store.setTransferError("file-1", "Connection lost");

      expect(store.transferError).toEqual({
        fileId: "file-1",
        message: "Connection lost",
      });

      store.clearTransferError();
      expect(store.transferError).toBeNull();
    });
  });

  describe("resetData", () => {
    it("clears all state", () => {
      const store = useDataStore();
      store.setFileDescription({
        id: "file-1",
        filename: "test.txt",
        size: 1024,
      });
      store.setFileToSend("file-2", new File(["data"], "send.txt"));
      store.setTransferError("file-1", "error");

      store.resetData();

      expect(Object.keys(store.filesToReceive)).toHaveLength(0);
      expect(Object.keys(store.filesToSend)).toHaveLength(0);
      expect(store.recFileId).toBeUndefined();
      expect(store.sendFileId).toBeUndefined();
      expect(store.transferError).toBeNull();
    });
  });
});
