import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string) || (import.meta.env.VITE_API_URL as string) || "http://localhost:8787";

export function useSocket(pollId: string | null, participantName?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!pollId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:poll", { pollId, participantName: participantName || "Anonymous" });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("participant:joined", ({ count }: { count: number }) => setParticipantCount(count));
    socket.on("participant:left", ({ count }: { count: number }) => setParticipantCount(count));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [pollId]);

  const emitVote = useCallback((data: Record<string, unknown>) => {
    socketRef.current?.emit("vote:submit", { pollId, ...data });
  }, [pollId]);

  const emitGoLive = useCallback(() => {
    socketRef.current?.emit("poll:go-live", { pollId });
  }, [pollId]);

  const emitEnd = useCallback(() => {
    socketRef.current?.emit("poll:end", { pollId });
  }, [pollId]);

  const emitPause = useCallback(() => {
    socketRef.current?.emit("poll:pause", { pollId });
  }, [pollId]);

  const emitQA = useCallback((text: string, author: string) => {
    socketRef.current?.emit("qa:submit", { pollId, text, author });
  }, [pollId]);

  const emitQAUpvote = useCallback((questionId: string) => {
    socketRef.current?.emit("qa:upvote", { pollId, questionId });
  }, [pollId]);

  return {
    socket: socketRef.current,
    connected,
    participantCount,
    emitVote,
    emitGoLive,
    emitEnd,
    emitPause,
    emitQA,
    emitQAUpvote
  };
}
