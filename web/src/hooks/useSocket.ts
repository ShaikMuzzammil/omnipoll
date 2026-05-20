import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { Poll, PollResults } from "@/lib/types";

export interface PollSocketPayload {
  poll: Poll;
  results: PollResults;
}

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

let sharedSocket: Socket | null = null;
let refCount = 0;

function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(BASE, { transports: ["websocket", "polling"] });
  }
  return sharedSocket;
}

export function useSocket(
  pollId: string | undefined | null,
  onUpdate: (payload: PollSocketPayload) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!pollId) return;
    refCount++;
    const socket = getSocket();

    const handler = (payload: PollSocketPayload) => {
      onUpdateRef.current(payload);
    };

    socket.emit("joinPoll", { pollId });
    socket.on("pollUpdate", handler);

    return () => {
      socket.off("pollUpdate", handler);
      refCount--;
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, [pollId]);
}

export function useSocketByCode(
  code: string | undefined | null,
  onUpdate: (payload: PollSocketPayload) => void,
  onError?: (msg: string) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!code) return;
    refCount++;
    const socket = getSocket();

    const updateHandler = (payload: PollSocketPayload) => {
      onUpdateRef.current(payload);
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
      refCount--;
      if (refCount <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        refCount = 0;
      }
    };
  }, [code]);
}
