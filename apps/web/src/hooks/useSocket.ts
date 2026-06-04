/// <reference types="../vite-env" />
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/authStore";
import { usePollStore } from "../store/pollStore";
import type { Poll, PollResults } from "../types";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket || socket.disconnected) {
    const token = useAuthStore.getState().accessToken;
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

interface UseSocketOptions {
  onUpdate?: (data: { poll: Poll; results: PollResults }) => void;
  onParticipantJoin?: (data: { participantId: string; count: number }) => void;
  onMessage?: (data: { type: string; message: string }) => void;
}

export function useSocket(pollId?: string, options?: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const { setActivePoll, setActiveResults, setLiveParticipants } = usePollStore();

  useEffect(() => {
    const s = getSocket();
    socketRef.current = s;

    if (pollId) {
      s.emit("poll:subscribe", { pollId });

      const handleUpdate = (data: { poll: Poll; results: PollResults }) => {
        setActivePoll(data.poll);
        setActiveResults(data.results);
        options?.onUpdate?.(data);
      };

      const handleParticipant = (data: { count: number; participantId: string }) => {
        setLiveParticipants(data.count);
        options?.onParticipantJoin?.(data);
      };

      const handleMessage = (data: { type: string; message: string }) => {
        options?.onMessage?.(data);
      };

      s.on("poll:update", handleUpdate);
      s.on("participant:join", handleParticipant);
      s.on("participant:leave", handleParticipant);
      s.on("broadcast:message", handleMessage);

      return () => {
        s.emit("poll:unsubscribe", { pollId });
        s.off("poll:update", handleUpdate);
        s.off("participant:join", handleParticipant);
        s.off("participant:leave", handleParticipant);
        s.off("broadcast:message", handleMessage);
      };
    }
  }, [pollId]);

  const emitVote = useCallback((data: Record<string, unknown>) => {
    socketRef.current?.emit("vote:submit", { pollId, ...data });
  }, [pollId]);

  const emitAction = useCallback((action: string) => {
    socketRef.current?.emit("present:action", { pollId, action });
  }, [pollId]);

  const emitQA = useCallback((question: string, name?: string) => {
    socketRef.current?.emit("qa:submit", { pollId, question, name });
  }, [pollId]);

  const emitUpvote = useCallback((questionId: string) => {
    socketRef.current?.emit("qa:upvote", { pollId, questionId });
  }, [pollId]);

  return {
    connected: socketRef.current?.connected ?? false,
    emitVote,
    emitAction,
    emitQA,
    emitUpvote,
    socket: socketRef.current,
  };
}
