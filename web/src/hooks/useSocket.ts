import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { Poll, PollResults } from "@/lib/types";

export interface PollSocketPayload {
  poll: Poll;
  results: PollResults;
}

export interface UseSocketReturn {
  connected: boolean;
  socket: Socket | null;
}

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

// Singleton socket instance
let sharedSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(BASE, { transports: ["websocket", "polling"] });
  }
  return sharedSocket;
}

/**
 * useSocket — subscribe to live poll updates for a given pollId.
 * Returns { connected, socket } for status checking.
 * Call with 0 args to get connection status only (no room join).
 */
export function useSocket(
  pollId?: string | null,
  onUpdate?: (payload: PollSocketPayload) => void
): UseSocketReturn {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    refCount++;
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      refCount--;
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!pollId) return;
    const socket = getSocket();

    const handler = (payload: PollSocketPayload) => {
      onUpdateRef.current?.(payload);
    };

    socket.emit("joinPoll", { pollId });
    socket.on("pollUpdate", handler);

    return () => {
      socket.off("pollUpdate", handler);
    };
  }, [pollId]);

  return { connected, socket: socketRef.current };
}

/**
 * useSocketByCode — join a poll room by its 6-char code.
 * Returns { connected, socket }.
 */
export function useSocketByCode(
  code?: string | null,
  onUpdate?: (payload: PollSocketPayload) => void,
  onError?: (msg: string) => void
): UseSocketReturn {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    refCount++;
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      refCount--;
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!code) return;
    const socket = getSocket();

    const updateHandler = (payload: PollSocketPayload) => {
      onUpdateRef.current?.(payload);
    };
    const errorHandler = ({ message }: { message: string }) => {
      onError?.(message);
    };

    socket.emit("joinByCode", { code });
    socket.on("pollUpdate", updateHandler);
    socket.on("error", errorHandler);

    return () => {
      socket.off("pollUpdate", updateHandler);
      socket.off("error", errorHandler);
    };
  }, [code]);

  return { connected, socket: socketRef.current };
}

/** Convenience — emit a single event on the shared socket */
export function emitSocketEvent(event: string, data?: unknown) {
  const socket = getSocket();
  socket.emit(event, data);
}
