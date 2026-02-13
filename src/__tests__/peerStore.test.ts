import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePeerStore } from "@/store/peerStore";

describe("peerStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("initializes with default state", () => {
    const store = usePeerStore();
    expect(store.clientId).toBe("");
    expect(store.remoteId).toBe("");
    expect(store.connectionStatus).toBe("disconnected");
    expect(store.connectionError).toBeNull();
  });

  describe("setClientId", () => {
    it("sets the client ID", () => {
      const store = usePeerStore();
      store.setClientId("test-id-12345678901");
      expect(store.clientId).toBe("test-id-12345678901");
    });
  });

  describe("setRemoteId", () => {
    it("sets the remote ID", () => {
      const store = usePeerStore();
      store.setRemoteId("remote-12345678901");
      expect(store.remoteId).toBe("remote-12345678901");
    });
  });

  describe("connection status", () => {
    it("sets connection status", () => {
      const store = usePeerStore();
      store.setConnectionStatus("connecting");
      expect(store.connectionStatus).toBe("connecting");
    });

    it("clears error when connected", () => {
      const store = usePeerStore();
      store.setConnectionError("Some error");
      expect(store.connectionError).toBe("Some error");

      store.setConnectionStatus("connected");
      expect(store.connectionError).toBeNull();
    });

    it("sets error and status to failed", () => {
      const store = usePeerStore();
      store.setConnectionError("ICE failed");
      expect(store.connectionStatus).toBe("failed");
      expect(store.connectionError).toBe("ICE failed");
    });

    it("clears error", () => {
      const store = usePeerStore();
      store.setConnectionError("error");
      store.clearError();
      expect(store.connectionError).toBeNull();
    });
  });

  describe("isValidPeerId", () => {
    it("accepts valid 20-char alphanumeric IDs", () => {
      const store = usePeerStore();
      expect(store.isValidPeerId("12345678901234567890")).toBe(true);
      expect(store.isValidPeerId("abcdefghijklmnopqrst")).toBe(true);
      expect(store.isValidPeerId("a1b2c3d4e5f6g7h8i9j0")).toBe(true);
      expect(store.isValidPeerId("abc_def-ghijklmnopqr")).toBe(true);
    });

    it("rejects IDs with wrong length", () => {
      const store = usePeerStore();
      expect(store.isValidPeerId("short")).toBe(false);
      expect(store.isValidPeerId("this-is-way-too-long-to-be-a-valid-id")).toBe(false);
      expect(store.isValidPeerId("")).toBe(false);
    });

    it("rejects IDs with invalid characters", () => {
      const store = usePeerStore();
      expect(store.isValidPeerId("abcdef ghijklmnopqrs")).toBe(false);
      expect(store.isValidPeerId("abcdef<script>hijklm")).toBe(false);
      expect(store.isValidPeerId("abcdef/ghijklmnopqrs")).toBe(false);
    });
  });
});
