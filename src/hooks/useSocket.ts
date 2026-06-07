import { useEffect, useRef, useState, useCallback } from "react";
import Pusher, { Channel } from "pusher-js";

const PUSHER_KEY     = (import.meta.env.VITE_PUSHER_KEY     as string) || "";
const PUSHER_CLUSTER = (import.meta.env.VITE_PUSHER_CLUSTER as string) || "ap2";
const API_BASE       = (import.meta.env.VITE_API_URL        as string) || "";

let pusherInstance: Pusher | null = null;
function getPusher() {
  if (!pusherInstance && PUSHER_KEY) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      authEndpoint: `${API_BASE}/api/pusher/auth`,
    });
  }
  return pusherInstance;
}

export function useSocket(pollId: string | null, participantName?: string) {
  const channelRef = useRef<Channel | null>(null);
  const [connected, setConnected]         = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  // Listeners stored so pages can bind their own handlers
  const listenersRef = useRef<Map<string, (data: unknown) => void>>(new Map());

  useEffect(() => {
    if (!pollId || !PUSHER_KEY) {
      // No Pusher key — still mark connected so REST-only flow works
      setConnected(true);
      return;
    }

    const pusher = getPusher()!;
    const channel = pusher.subscribe(`poll-${pollId}`);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => setConnected(true));
    channel.bind("pusher:subscription_error",     () => setConnected(false));

    // Participant count events
    channel.bind("participant:joined", ({ count }: { count: number }) => setParticipantCount(count));
    channel.bind("participant:left",   ({ count }: { count: number }) => setParticipantCount(count));

    // Forward all events to registered listeners
    const ALL_EVENTS = [
      "poll:vote","poll:started","poll:paused","poll:ended","poll:updated",
      "qa:question","qa:upvote","qa:updated",
    ];
    ALL_EVENTS.forEach(ev => {
      channel.bind(ev, (data: unknown) => {
        listenersRef.current.get(ev)?.(data);
      });
    });

    // Announce participant join via REST
    if (participantName) {
      fetch(`${API_BASE}/api/polls/${pollId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: crypto.randomUUID(), participantName }),
      }).catch(() => {});
    }

    return () => {
      pusher.unsubscribe(`poll-${pollId}`);
      channelRef.current = null;
    };
  }, [pollId]);

  /** Register a Pusher event listener — returns cleanup fn */
  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    listenersRef.current.set(event, handler);
    return () => listenersRef.current.delete(event);
  }, []);

  /** Trigger go-live via REST */
  const emitGoLive = useCallback(() => {
    if (!pollId) return;
    fetch(`${API_BASE}/api/polls/${pollId}/go-live`, { method: "POST" }).catch(() => {});
  }, [pollId]);

  const emitPause = useCallback(() => {
    if (!pollId) return;
    fetch(`${API_BASE}/api/polls/${pollId}/pause`, { method: "POST" }).catch(() => {});
  }, [pollId]);

  const emitEnd = useCallback(() => {
    if (!pollId) return;
    fetch(`${API_BASE}/api/polls/${pollId}/end`, { method: "POST" }).catch(() => {});
  }, [pollId]);

  /** Vote via REST (triggers Pusher on server side) */
  const emitVote = useCallback((data: Record<string, unknown>) => {
    if (!pollId) return;
    fetch(`${API_BASE}/api/polls/${pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => {});
  }, [pollId]);

  const emitQA = useCallback((text: string, author: string) => {
    if (!pollId) return;
    fetch(`${API_BASE}/api/polls/${pollId}/qa/question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, author }),
    }).catch(() => {});
  }, [pollId]);

  const emitQAUpvote = useCallback((questionId: string) => {
    if (!pollId) return;
    fetch(`${API_BASE}/api/polls/${pollId}/qa/${questionId}/upvote`, { method: "POST" }).catch(() => {});
  }, [pollId]);

  return {
    socket: channelRef.current,
    connected,
    participantCount,
    on,
    emitVote,
    emitGoLive,
    emitEnd,
    emitPause,
    emitQA,
    emitQAUpvote,
  };
}
